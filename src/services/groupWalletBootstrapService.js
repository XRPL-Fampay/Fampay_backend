const createError = require('http-errors');
const CryptoJS = require('crypto-js');
const xrpl = require('xrpl');
const { prisma } = require('../db/prisma');
const config = require('../config');
const { getClient } = require('./xrplClient');
const XRPLPermissionedDomainsService = require('./xrplPermissionedDomainsService');

const DEFAULT_CREDENTIAL_TYPE = 'KYC';
const DEFAULT_CREDENTIAL_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const DEFAULT_TRUSTLINE_CURRENCY = config.xrpl?.rlusdCurrency || 'RLUSD';
const DEFAULT_TRUSTLINE_LIMIT = '1000000';

function toHex(value) {
  if (!value) {
    return undefined;
  }
  return Buffer.from(value, 'utf8').toString('hex');
}

function resolveSeed(encryptedSecret, context) {
  if (!encryptedSecret) {
    throw createError(400, `${context}에 연결된 XRPL 시드 정보를 찾을 수 없습니다.`);
  }

  const trimmed = encryptedSecret.trim();

  if (trimmed.startsWith('s')) {
    return trimmed;
  }

  try {
    const bytes = CryptoJS.AES.decrypt(trimmed, config.security.encryptionKey);
    const decoded = bytes.toString(CryptoJS.enc.Utf8);
    if (!decoded) {
      throw new Error('복호화된 페이로드가 비어 있습니다.');
    }

    const parsed = JSON.parse(decoded);
    if (typeof parsed === 'string') {
      return parsed;
    }

    if (parsed.seed) {
      return parsed.seed;
    }

    if (parsed.secret) {
      return parsed.secret;
    }

    throw new Error('페이로드에서 seed/secret 필드를 찾을 수 없습니다.');
  } catch (error) {
    throw createError(400, `${context}의 암호화된 시드를 복호화할 수 없습니다: ${error.message}`);
  }
}

async function issueCredential({ issuerSeed, subjectAddress, credentialType, ttlSeconds, uri }) {
  if (!issuerSeed || !subjectAddress) {
    throw createError(400, 'issuerSeed와 subjectAddress는 필수입니다.');
  }

  const issuerWallet = xrpl.Wallet.fromSeed(issuerSeed.trim());
  const client = await getClient();

  const expirationEpoch = Math.floor(Date.now() / 1000) + (ttlSeconds || DEFAULT_CREDENTIAL_TTL_SECONDS);

  const tx = {
    TransactionType: 'CredentialCreate',
    Account: issuerWallet.address,
    Subject: subjectAddress,
    CredentialType: toHex(credentialType || DEFAULT_CREDENTIAL_TYPE),
    Expiration: expirationEpoch,
    URI: uri ? toHex(uri) : undefined
  };

  const prepared = await client.autofill(tx);
  const signed = issuerWallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);
  const hash = result.result?.tx_json?.hash || signed.hash;

  return {
    hash,
    account: issuerWallet.address,
    subject: subjectAddress,
    credentialType: credentialType || DEFAULT_CREDENTIAL_TYPE,
    expiration: expirationEpoch,
    raw: result.result
  };
}

async function setTrustLine({ seed, currency, issuer, limit }) {
  if (!seed || !currency || !issuer || !limit) {
    throw createError(400, 'seed, currency, issuer, limit는 필수입니다.');
  }

  const wallet = xrpl.Wallet.fromSeed(seed.trim());
  const client = await getClient();

  const tx = {
    TransactionType: 'TrustSet',
    Account: wallet.address,
    LimitAmount: {
      currency,
      issuer,
      value: String(limit)
    }
  };

  const prepared = await client.autofill(tx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);
  const hash = result.result?.tx_json?.hash || signed.hash;

  return {
    hash,
    account: wallet.address,
    limitAmount: tx.LimitAmount,
    raw: result.result
  };
}

async function bootstrapGroupWallet({
  groupId,
  credentialType = DEFAULT_CREDENTIAL_TYPE,
  credentialTtlSeconds = DEFAULT_CREDENTIAL_TTL_SECONDS,
  trustlineCurrency = DEFAULT_TRUSTLINE_CURRENCY,
  trustlineLimit = DEFAULT_TRUSTLINE_LIMIT,
  trustlineIssuer
}) {
  if (!groupId) {
    throw createError(400, 'groupId는 필수입니다.');
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      groupWallet: true,
      hostUser: {
        include: {
          primaryWallet: true
        }
      },
      members: {
        include: {
          user: {
            include: {
              primaryWallet: true
            }
          }
        }
      }
    }
  });

  if (!group) {
    throw createError(404, `그룹을 찾을 수 없습니다 (id=${groupId}).`);
  }

  if (!group.groupWallet) {
    throw createError(400, '그룹에 연결된 그룹 지갑이 존재하지 않습니다.');
  }

  const hostWalletRecord = group.hostUser?.primaryWallet;
  if (!hostWalletRecord) {
    throw createError(400, '그룹 호스트에 기본 지갑이 설정되어 있지 않습니다.');
  }

  const issuerSeed = resolveSeed(hostWalletRecord.encryptedSecret, '호스트 사용자');
  const groupWalletSeed = resolveSeed(group.groupWallet.encryptedSecret, '그룹 지갑');

  const issuerWallet = xrpl.Wallet.fromSeed(issuerSeed.trim());
  const acceptedCredentials = [];
  const credentialSuccess = [];
  const credentialFailures = [];

  for (const member of group.members) {
    const memberWallet = member.user?.primaryWallet;
    if (!memberWallet?.xrplAddress) {
      credentialFailures.push({
        memberId: member.id,
        userId: member.userId,
        reason: 'PRIMARY_WALLET_MISSING'
      });
      continue;
    }

    try {
      const uri = `https://demo.fampay/groups/${group.id}/members/${member.id}`;
      const result = await issueCredential({
        issuerSeed,
        subjectAddress: memberWallet.xrplAddress,
        credentialType,
        ttlSeconds: credentialTtlSeconds,
        uri
      });

      credentialSuccess.push({
        memberId: member.id,
        userId: member.userId,
        walletAddress: memberWallet.xrplAddress,
        hash: result.hash,
        expiration: result.expiration
      });

      acceptedCredentials.push({
        Credential: {
          Issuer: issuerWallet.address,
          Subject: memberWallet.xrplAddress,
          CredentialType: toHex(credentialType)
        }
      });
    } catch (error) {
      credentialFailures.push({
        memberId: member.id,
        userId: member.userId,
        walletAddress: member.user?.primaryWallet?.xrplAddress || null,
        reason: error.message || 'ISSUE_FAILED'
      });
    }
  }

  let domainResult = null;
  let domainError = null;

  if (acceptedCredentials.length > 0) {
    const permissionedService = new XRPLPermissionedDomainsService();
    try {
      domainResult = await permissionedService.createDomain(issuerSeed, acceptedCredentials);
    } catch (error) {
      domainError = error.message || 'PERMISSIONED_DOMAIN_FAILED';
    }
  } else {
    domainError = 'ACCEPTED_CREDENTIALS_NOT_AVAILABLE';
  }

  const resolvedIssuerAddress =
    trustlineIssuer || config.xrpl?.rlusdIssuer || issuerWallet.address;

  let trustlineResult = null;
  let trustlineError = null;

  try {
    trustlineResult = await setTrustLine({
      seed: groupWalletSeed,
      currency: trustlineCurrency,
      issuer: resolvedIssuerAddress,
      limit: trustlineLimit
    });
  } catch (error) {
    trustlineError = error.message || 'TRUSTLINE_FAILED';
  }

  return {
    groupId: group.id,
    issuerAccount: issuerWallet.address,
    credential: {
      issued: credentialSuccess,
      failed: credentialFailures
    },
    permissionedDomain: {
      result: domainResult,
      error: domainError
    },
    trustline: {
      result: trustlineResult,
      error: trustlineError
    }
  };
}

module.exports = {
  bootstrapGroupWallet
};
