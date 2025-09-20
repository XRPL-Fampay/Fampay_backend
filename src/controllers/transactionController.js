const {
  createTransaction,
  updateTransactionStatus,
  listGroupTransactions
} = require('../services/transactionService');
const { createRecurringPlan, updateRecurringPlan, listPlans } = require('../services/recurringPlanService');
const { executeXRPLTransaction } = require('../services/xrpl/transactionExecutor');
const createError = require('http-errors');

async function createGroupTransaction(req, res, next) {
  try {
    const { groupId } = req.params;
    const {
      type,
      amountDrops,
      currency,
      sourceWalletId,
      destinationWalletId,
      memo,
      recurringPlanId,
      xrpl: xrplPayload
    } = req.body || {};

    let transaction = await createTransaction({
      groupId,
      type,
      amountDrops,
      currency,
      sourceWalletId,
      destinationWalletId,
      memo,
      recurringPlanId
    });

    if (xrplPayload?.execute) {
      try {
        const xrplResult = await executeXRPLTransaction({
          type,
          payload: {
            seed: xrplPayload.seed,
            destination: xrplPayload.destination,
            amountDrops: xrplPayload.amountDrops || amountDrops,
            amountXrp: xrplPayload.amountXrp,
            currency,
            issuer: xrplPayload.issuer,
            memo,
            finishAfter: xrplPayload.finishAfter,
            cancelAfter: xrplPayload.cancelAfter,
            condition: xrplPayload.condition,
            fulfillment: xrplPayload.fulfillment,
            owner: xrplPayload.owner,
            offerSequence: xrplPayload.offerSequence
          }
        });

        transaction = await updateTransactionStatus(
          transaction.id,
          'CONFIRMED',
          new Date(),
          xrplResult.hash
        );

        res.status(201).json({ ...transaction, xrpl: xrplResult });
        return;
      } catch (error) {
        await updateTransactionStatus(transaction.id, 'FAILED');
        return next(error);
      }
    }

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
}

async function updateGroupTransaction(req, res, next) {
  try {
    const { transactionId } = req.params;
    const { status, confirmedAt, xrplHash } = req.body || {};

    if (!status) {
      throw createError(400, 'status는 필수입니다.');
    }

    const result = await updateTransactionStatus(transactionId, status, confirmedAt, xrplHash);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function listTransactions(req, res, next) {
  try {
    const { groupId } = req.params;
    const { limit, cursor } = req.query;

    const result = await listGroupTransactions(groupId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function createPlan(req, res, next) {
  try {
    const { groupId } = req.params;
    const plan = await createRecurringPlan({ groupId, ...req.body });
    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
}

async function updatePlan(req, res, next) {
  try {
    const { planId } = req.params;
    const plan = await updateRecurringPlan(planId, req.body || {});
    res.status(200).json(plan);
  } catch (error) {
    next(error);
  }
}

async function listGroupPlans(req, res, next) {
  try {
    const { groupId } = req.params;
    const plans = await listPlans(groupId);
    res.status(200).json(plans);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createGroupTransaction,
  updateGroupTransaction,
  listTransactions,
  createPlan,
  updatePlan,
  listGroupPlans
};
