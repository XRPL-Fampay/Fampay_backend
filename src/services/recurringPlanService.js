const createError = require('http-errors');
const { prisma } = require('../db/prisma');

function buildPlanInclude() {
  return {
    group: true,
    createdBy: true,
    destinationWallet: true,
    transactions: true
  };
}

async function ensureGroup(tx, groupId) {
  const group = await tx.group.findUnique({ where: { id: groupId } });
  if (!group) {
    throw createError(404, `Group not found for id=${groupId}`);
  }
  return group;
}

async function ensureUser(tx, userId) {
  const user = await tx.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw createError(404, `User not found for id=${userId}`);
  }
  return user;
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

async function createRecurringPlan({
  groupId,
  createdById,
  type,
  amountDrops,
  currency = 'XRP',
  scheduleCron,
  memo,
  destinationWalletId,
  escrowReleaseAt,
  status = 'ACTIVE'
}) {
  if (!groupId || !createdById || !type || !amountDrops || !scheduleCron) {
    throw createError(400, 'groupId, createdById, type, amountDrops, scheduleCron은 필수입니다.');
  }

  return prisma.$transaction(async (tx) => {
    await ensureGroup(tx, groupId);
    await ensureUser(tx, createdById);
    await ensureWallet(tx, destinationWalletId);

    const plan = await tx.recurringPlan.create({
      data: {
        groupId,
        createdById,
        type,
        amountDrops,
        currency,
        scheduleCron,
        memo,
        destinationWalletId,
        escrowReleaseAt,
        status
      },
      include: buildPlanInclude()
    });

    return plan;
  });
}

async function updateRecurringPlan(id, data) {
  if (!id) {
    throw createError(400, 'id는 필수입니다.');
  }

  const plan = await prisma.recurringPlan.update({
    where: { id },
    data,
    include: buildPlanInclude()
  });

  return plan;
}

async function listPlans(groupId) {
  if (!groupId) {
    throw createError(400, 'groupId는 필수입니다.');
  }

  return prisma.recurringPlan.findMany({
    where: { groupId },
    include: buildPlanInclude()
  });
}

module.exports = {
  createRecurringPlan,
  updateRecurringPlan,
  listPlans
};
