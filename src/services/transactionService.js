const createError = require('http-errors');
const { prisma } = require('../db/prisma');

function buildTransactionInclude() {
  return {
    group: true,
    sourceWallet: true,
    destinationWallet: true,
    recurringPlan: true
  };
}

async function ensureGroup(tx, groupId) {
  const group = await tx.group.findUnique({ where: { id: groupId } });
  if (!group) {
    throw createError(404, `Group not found for id=${groupId}`);
  }
  return group;
}

async function ensureWallet(tx, walletId) {
  if (!walletId) {
    return null;
  }
  const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
  if (!wallet) {
    throw createError(404, `Wallet not found for id=${walletId}`);
  }
  return wallet;
}

async function createTransaction({
  groupId,
  type,
  amountDrops,
  currency = 'XRP',
  sourceWalletId,
  destinationWalletId,
  memo,
  status = 'PENDING',
  recurringPlanId
}) {
  if (!groupId || !type || !amountDrops) {
    throw createError(400, 'groupId, type, amountDrops는 필수입니다.');
  }

  return prisma.$transaction(async (tx) => {
    await ensureGroup(tx, groupId);
    await ensureWallet(tx, sourceWalletId);
    await ensureWallet(tx, destinationWalletId);

    if (recurringPlanId) {
      const plan = await tx.recurringPlan.findUnique({ where: { id: recurringPlanId } });
      if (!plan) {
        throw createError(404, `Recurring plan not found for id=${recurringPlanId}`);
      }
    }

    const transaction = await tx.transaction.create({
      data: {
        groupId,
        type,
        amountDrops,
        currency,
        sourceWalletId,
        destinationWalletId,
        memo,
        status,
        recurringPlanId,
        submittedAt: new Date()
      },
      include: buildTransactionInclude()
    });

    return transaction;
  });
}

async function updateTransactionStatus(id, status, confirmedAt, xrplHash) {
  if (!id || !status) {
    throw createError(400, 'id와 status는 필수입니다.');
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      status,
      confirmedAt: confirmedAt || (status === 'CONFIRMED' ? new Date() : null),
      xrplHash: xrplHash || undefined
    },
    include: buildTransactionInclude()
  });

  return transaction;
}

async function listGroupTransactions(groupId, { limit = 50, cursor } = {}) {
  if (!groupId) {
    throw createError(400, 'groupId는 필수입니다.');
  }

  const query = {
    where: { groupId },
    orderBy: { submittedAt: 'desc' },
    take: limit,
    include: buildTransactionInclude()
  };

  if (cursor) {
    query.skip = 1;
    query.cursor = { id: cursor };
  }

  const items = await prisma.transaction.findMany(query);

  return items;
}

module.exports = {
  createTransaction,
  updateTransactionStatus,
  listGroupTransactions
};
