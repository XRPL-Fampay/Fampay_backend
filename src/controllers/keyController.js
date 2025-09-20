const createError = require('http-errors');
const keyService = require('../services/keyManagementService');

async function createWallet(req, res, next) {
  try {
    const result = await keyService.createWallet({ userId: req.user.id, strength: req.body?.strength });
    res.status(201).json({ mnemonic: result.mnemonic, wallet: result.wallet });
  } catch (error) {
    next(error);
  }
}

async function recoverWallet(req, res, next) {
  try {
    const { mnemonic } = req.body || {};
    const wallet = await keyService.recoverWallet({ mnemonic });
    res.status(200).json(wallet);
  } catch (error) {
    next(error);
  }
}

async function setupMultisig(req, res, next) {
  try {
    const { signers, quorum } = req.body || {};
    const config = await keyService.setupMultisig({ userId: req.user.id, signers, quorum });
    res.status(200).json(config);
  } catch (error) {
    next(error);
  }
}

async function setupSocialRecovery(req, res, next) {
  try {
    const { guardians, threshold } = req.body || {};
    const config = await keyService.setupSocialRecovery({ userId: req.user.id, guardians, threshold });
    res.status(200).json(config);
  } catch (error) {
    next(error);
  }
}

async function executeSocialRecovery(req, res, next) {
  try {
    const { approvals, newSeed } = req.body || {};
    if (!Array.isArray(approvals) || !newSeed) {
      throw createError(400, 'approvals와 newSeed가 필요합니다.');
    }
    const wallet = await keyService.executeSocialRecovery({ userId: req.user.id, approvals, newSeed });
    res.status(200).json(wallet);
  } catch (error) {
    next(error);
  }
}

async function setupHybridCustody(req, res, next) {
  try {
    const { mode, metadata } = req.body || {};
    const result = await keyService.setupHybridCustody({ userId: req.user.id, mode, metadata });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function createBackup(req, res, next) {
  try {
    const { payload, label } = req.body || {};
    const backup = await keyService.createBackup({ userId: req.user.id, payload, label });
    res.status(201).json(backup);
  } catch (error) {
    next(error);
  }
}

async function restoreFromBackup(req, res, next) {
  try {
    const { backupId } = req.body || {};
    const data = await keyService.restoreFromBackup({ backupId, userId: req.user.id });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function listBackups(req, res, next) {
  try {
    const backups = await keyService.listBackups(req.user.id);
    res.status(200).json(backups);
  } catch (error) {
    next(error);
  }
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
