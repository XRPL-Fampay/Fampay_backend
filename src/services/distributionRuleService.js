const createError = require('http-errors');
const { prisma } = require('../db/prisma');

function validateSplits(splits) {
  if (!Array.isArray(splits) || splits.length === 0) {
    throw createError(400, 'splits 배열이 필요합니다.');
  }
  const total = splits.reduce((sum, entry) => {
    if (!entry.walletId && !entry.xrplAddress) {
      throw createError(400, '각 split에는 walletId 또는 xrplAddress가 필요합니다.');
    }
    if (typeof entry.percentage !== 'number') {
      throw createError(400, 'percentage는 숫자여야 합니다.');
    }
    if (entry.walletId && typeof entry.walletId !== 'string') {
      throw createError(400, 'walletId는 문자열이어야 합니다.');
    }
    if (entry.xrplAddress && typeof entry.xrplAddress !== 'string') {
      throw createError(400, 'xrplAddress는 문자열이어야 합니다.');
    }
    return sum + entry.percentage;
  }, 0);

  if (Math.abs(total - 100) > 0.001) {
    throw createError(400, 'percentage 합계는 100이어야 합니다.');
  }
}

async function createRule({ groupId, name, splits, isActive = true }) {
  if (!name) {
    throw createError(400, 'name은 필수입니다.');
  }
  validateSplits(splits);

  const resolvedSplits = await resolveSplitsWallets(groupId, splits);

  return prisma.distributionRule.create({
    data: {
      groupId,
      name,
      splits: resolvedSplits,
      isActive
    }
  });
}

async function listRules(groupId) {
  return prisma.distributionRule.findMany({
    where: { groupId },
    orderBy: { createdAt: 'desc' }
  });
}

async function updateRule({ ruleId, name, splits, isActive }) {
  const data = {};
  if (name !== undefined) data.name = name;
  if (splits !== undefined) {
    validateSplits(splits);
    data.splits = await resolveSplitsWallets(undefined, splits, ruleId);
  }
  if (typeof isActive === 'boolean') {
    data.isActive = isActive;
  }

  const rule = await prisma.distributionRule.update({
    where: { id: ruleId },
    data
  });
  return rule;
}

async function deleteRule(ruleId) {
  await prisma.distributionRule.delete({ where: { id: ruleId } });
  return { success: true };
}

async function getRule(ruleId) {
  const rule = await prisma.distributionRule.findUnique({ where: { id: ruleId } });
  if (!rule) {
    throw createError(404, 'distributionRule을 찾을 수 없습니다.');
  }
  return rule;
}

async function resolveSplitsWallets(groupId, splits, ruleId) {
  let group;
  if (groupId) {
    group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true }
    });
    if (!group) {
      throw createError(404, 'group를 찾을 수 없습니다.');
    }
  } else if (ruleId) {
    const existingRule = await prisma.distributionRule.findUnique({
      where: { id: ruleId },
      include: {
        group: {
          include: { members: true }
        }
      }
    });
    if (existingRule && existingRule.group) {
      group = existingRule.group;
    }
  }
  let memberSet;
  if (group) {
    memberSet = new Set(group.members.map((member) => member.userId));
  }

  const resolved = [];
  for (const split of splits) {
    const entry = { ...split };
    if (entry.walletId && !entry.xrplAddress) {
      const wallet = await prisma.wallet.findUnique({ where: { id: entry.walletId } });
      if (!wallet) {
        throw createError(404, `walletId=${entry.walletId} 를 찾을 수 없습니다.`);
      }
      if (group) {
        const belongs = wallet.id === group.groupWalletId || (wallet.ownerUserId && memberSet.has(wallet.ownerUserId));
        if (!belongs) {
          throw createError(400, `walletId=${entry.walletId} 는 그룹에 속하지 않습니다.`);
        }
      }
      entry.xrplAddress = wallet.xrplAddress;
    }
    resolved.push(entry);
  }
  return resolved;
}

module.exports = {
  createRule,
  listRules,
  updateRule,
  deleteRule,
  getRule
};
