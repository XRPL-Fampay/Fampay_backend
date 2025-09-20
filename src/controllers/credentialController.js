const createError = require('http-errors');
const xrplCredentialService = require('../services/xrplCredentialService');
const { getGroupById } = require('../services/groupService');
const CryptoJS = require('crypto-js');
const config = require('../config');

function decryptSecret(encryptedData) {
  const bytes = CryptoJS.AES.decrypt(encryptedData, config.security.encryptionKey);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

async function createCredential(req, res, next) {
  try {
    const { groupId } = req.params;
    const { subjectAddress, credentialType = "GROUP_MEMBER", expirationHours = 8760 } = req.body;

    if (!subjectAddress) {
      throw createError(400, 'subjectAddress는 필수입니다.');
    }

    // Get group and decrypt wallet seed
    const group = await getGroupById(groupId);
    const { seed } = decryptSecret(group.groupWallet.encryptedSecret);

    const result = await xrplCredentialService.createCredential({
      issuerSeed: seed,
      subjectAddress,
      credentialType,
      expirationHours,
      uri: `fampay://group/${groupId}/member`
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function checkCredential(req, res, next) {
  try {
    const { groupId } = req.params;
    const { subjectAddress, credentialType = "GROUP_MEMBER" } = req.query;

    if (!subjectAddress) {
      throw createError(400, 'subjectAddress 쿼리 파라미터가 필요합니다.');
    }

    // Get group issuer address
    const group = await getGroupById(groupId);
    const issuerAddress = group.groupWallet.xrplAddress;

    const result = await xrplCredentialService.checkCredential(
      subjectAddress,
      issuerAddress,
      credentialType
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function createGroupCredentials(req, res, next) {
  try {
    const { groupId } = req.params;
    const { memberAddresses } = req.body;

    if (!memberAddresses || !Array.isArray(memberAddresses)) {
      throw createError(400, 'memberAddresses 배열이 필요합니다.');
    }

    // Get group and decrypt wallet seed
    const group = await getGroupById(groupId);
    const { seed } = decryptSecret(group.groupWallet.encryptedSecret);

    const results = await xrplCredentialService.createGroupMemberCredentials({
      groupWalletSeed: seed,
      memberAddresses,
      groupId
    });

    res.status(201).json({
      groupId,
      credentialResults: results,
      successCount: results.filter(r => r.success).length,
      totalCount: results.length
    });
  } catch (error) {
    next(error);
  }
}

async function verifyGroupAccess(req, res, next) {
  try {
    const { groupId } = req.params;
    const { userAddress } = req.query;

    if (!userAddress) {
      throw createError(400, 'userAddress 쿼리 파라미터가 필요합니다.');
    }

    // Get group issuer address
    const group = await getGroupById(groupId);
    const issuerAddress = group.groupWallet.xrplAddress;

    const credentialCheck = await xrplCredentialService.checkCredential(
      userAddress,
      issuerAddress,
      "GROUP_MEMBER"
    );

    res.status(200).json({
      groupId,
      userAddress,
      hasAccess: credentialCheck.hasValidCredential,
      credential: credentialCheck.credential
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createCredential,
  checkCredential,
  createGroupCredentials,
  verifyGroupAccess
};