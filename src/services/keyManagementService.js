const bip39 = require('bip39');
const CryptoJS = require('crypto-js');
const createError = require('http-errors');
const xrpl = require('xrpl');
const { prisma } = require('../db/prisma');
const config = require('../config');

function encrypt(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), config.security.encryptionKey).toString();
}

function decrypt(cipherText) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, config.security.encryptionKey);
    const decoded = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decoded);
  } catch (error) {
    throw createError(400, '백업을 복원할 수 없습니다.');
  }
}

async function createWallet({ userId, strength = 256 }) {
  const mnemonic = bip39.generateMnemonic(strength);
  const wallet = xrpl.Wallet.fromMnemonic(mnemonic, { algorithm: 'secp256k1' });
  await prisma.wallet.create({
    data: {
      xrplAddress: wallet.classicAddress,
      publicKey: wallet.publicKey,
      encryptedSecret: encrypt({ seed: wallet.seed }),
      label: 'Primary Wallet',
      ownerUserId: userId
    }
  });
  return { mnemonic, wallet };
}

async function recoverWallet({ mnemonic }) {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw createError(400, '올바르지 않은 니모닉입니다.');
  }
  const wallet = xrpl.Wallet.fromMnemonic(mnemonic, { algorithm: 'secp256k1' });
  return {
    address: wallet.classicAddress,
    publicKey: wallet.publicKey,
    seed: wallet.seed
  };
}

async function setupMultisig({ userId, signers, quorum }) {
  if (!Array.isArray(signers) || !signers.length) {
    throw createError(400, 'signers 배열이 필요합니다.');
  }
  if (!quorum || quorum > signers.length) {
    throw createError(400, 'quorum 값이 올바르지 않습니다.');
  }
  const configData = { signers, quorum };
  await prisma.multisigConfig.upsert({
    where: { userId },
    update: configData,
    create: { userId, ...configData }
  });
  return configData;
}

async function setupSocialRecovery({ userId, guardians, threshold }) {
  if (!Array.isArray(guardians) || guardians.length < 1) {
    throw createError(400, 'guardians 배열이 필요합니다.');
  }
  if (!threshold || threshold > guardians.length) {
    throw createError(400, 'threshold 값이 올바르지 않습니다.');
  }
  const configData = { guardians, threshold };
  await prisma.socialRecoveryConfig.upsert({
    where: { userId },
    update: configData,
    create: { userId, ...configData }
  });
  return configData;
}

async function executeSocialRecovery({ userId, approvals, newSeed }) {
  const configRecord = await prisma.socialRecoveryConfig.findUnique({ where: { userId } });
  if (!configRecord) {
    throw createError(404, '소셜 리커버리 설정을 찾을 수 없습니다.');
  }
  const approvedSet = new Set(approvals);
  const guardianSet = new Set(configRecord.guardians);
  const approved = configRecord.guardians.filter((guardian) => approvedSet.has(guardian));
  if (approved.length < configRecord.threshold) {
    throw createError(403, '승인 수가 충분하지 않습니다.');
  }
  const wallet = xrpl.Wallet.fromSeed(newSeed);
  await prisma.wallet.updateMany({
    where: { ownerUserId: userId },
    data: {
      encryptedSecret: encrypt({ seed: wallet.seed })
    }
  });
  return {
    address: wallet.classicAddress,
    publicKey: wallet.publicKey
  };
}

async function setupHybridCustody({ userId, mode, metadata }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const currentMeta = user?.biometricMeta && typeof user.biometricMeta === 'object' ? user.biometricMeta : {};
  const nextMeta = { ...currentMeta, hybridCustody: { mode, metadata } };
  await prisma.user.update({ where: { id: userId }, data: { biometricMeta: nextMeta } });
  return { mode };
}

async function createBackup({ userId, label, payload }) {
  if (!payload) {
    throw createError(400, '백업 데이터가 필요합니다.');
  }
  const encryptedData = encrypt(payload);
  const backup = await prisma.walletBackup.create({
    data: {
      userId,
      encryptedData,
      label
    }
  });
  return backup;
}

async function restoreFromBackup({ backupId, userId }) {
  const backup = await prisma.walletBackup.findFirst({
    where: {
      id: backupId,
      userId
    }
  });
  if (!backup) {
    throw createError(404, '백업을 찾을 수 없습니다.');
  }
  return decrypt(backup.encryptedData);
}

async function listBackups(userId) {
  return prisma.walletBackup.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
}

module.exports = {
  createWallet,
  recoverWallet,
  setupMultisig,
  setupSocialRecovery,
  executeSocialRecovery,
  setupHybridCustody,
  createBackup,
  restoreFromBackup,
  listBackups
};
