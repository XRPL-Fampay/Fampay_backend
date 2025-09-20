const createError = require('http-errors');
const {
  submitPayment,
  submitBatch,
  createEscrow,
  finishEscrow,
  cancelEscrow
} = require('../services/xrpl/transactionExecutor');

async function sendPayment(req, res, next) {
  try {
    const { destination } = req.body || {};
    if (!destination) {
      throw createError(400, 'destination은 필수입니다.');
    }
    const result = await submitPayment(req.body || {});
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function sendBatch(req, res, next) {
  try {
    const { instructions } = req.body || {};
    if (!Array.isArray(instructions) || instructions.length === 0) {
      throw createError(400, 'instructions 배열이 필요합니다.');
    }
    const result = await submitBatch(req.body || {});
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function escrowCreate(req, res, next) {
  try {
    const { destination, amountDrops } = req.body || {};
    if (!destination || !amountDrops) {
      throw createError(400, 'destination과 amountDrops는 필수입니다.');
    }
    const result = await createEscrow(req.body || {});
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function escrowFinish(req, res, next) {
  try {
    const { owner, offerSequence } = req.body || {};
    if (!owner || typeof offerSequence === 'undefined') {
      throw createError(400, 'owner와 offerSequence는 필수입니다.');
    }
    const result = await finishEscrow(req.body || {});
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function escrowCancel(req, res, next) {
  try {
    const { owner, offerSequence } = req.body || {};
    if (!owner || typeof offerSequence === 'undefined') {
      throw createError(400, 'owner와 offerSequence는 필수입니다.');
    }
    const result = await cancelEscrow(req.body || {});
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  sendPayment,
  sendBatch,
  escrowCreate,
  escrowFinish,
  escrowCancel
};
