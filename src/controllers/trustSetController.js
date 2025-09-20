const createError = require('http-errors');
const trustSetService = require('../services/xrpl/trustSetService');

async function setupTrustLine(req, res, next) {
  try {
    const { seed, currency, issuer, limit, memo, flags } = req.body || {};
    if (!currency || !issuer) {
      throw createError(400, 'currency와 issuer는 필수입니다.');
    }
    const result = await trustSetService.setupTrustLine({ seed, currency, issuer, limit, memo, flags });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function authorizeTrustLine(req, res, next) {
  try {
    const { seed, currency, counterparty, memo } = req.body || {};
    if (!currency || !counterparty) {
      throw createError(400, 'currency와 counterparty는 필수입니다.');
    }
    const result = await trustSetService.authorizeTrustLine({ seed, currency, counterparty, memo });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  setupTrustLine,
  authorizeTrustLine
};
