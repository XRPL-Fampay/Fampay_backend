const createError = require('http-errors');
const {
  generateWallet: generateWalletService,
  faucetWallet: faucetWalletService,
  getWalletInfo: getWalletInfoService,
  validateAddress
} = require('../services/xrpl/walletService');

async function generateWallet(req, res, next) {
  try {
    const { fund = false } = req.body || {};
    const result = await generateWalletService({ fund });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function faucetWallet(req, res, next) {
  try {
    const { seed, address } = req.body || {};
    const result = await faucetWalletService({ seed, address });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getWalletInfo(req, res, next) {
  try {
    const { address } = req.params;
    const result = await getWalletInfoService(address);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function validateWallet(req, res, next) {
  try {
    const { address } = req.body || {};
    if (!address) {
      throw createError(400, 'address 필드는 필수입니다.');
    }

    res.status(200).json({
      address,
      isValid: validateAddress(address)
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateWallet,
  faucetWallet,
  getWalletInfo,
  validateWallet
};
