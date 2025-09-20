const createError = require('http-errors');
const { prisma } = require('../db/prisma');

function buildGroupInclude() {
  return {
    hostUser: true,
    groupWallet: true,
    members: {
      include: {
        user: true
      }
    }
  };
}

async function ensureUser(tx, userId) {
  const user = await tx.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw createError(404, `User not found for id=${userId}`);
  }
  return user;
}

async function ensureGroup(tx, groupId) {
  const group = await tx.group.findUnique({ where: { id: groupId } });
  if (!group) {
    throw createError(404, `Group not found for id=${groupId}`);
  }
  return group;
}

async function createGroup({ hostUserId, title, description, wallet }) {
  if (!hostUserId || !title) {
    throw createError(400, 'hostUserId와 title은 필수입니다.');
  }

  if (!wallet || !wallet.xrplAddress) {
    throw createError(400, 'wallet.xrplAddress는 필수입니다.');
  }

  return prisma.$transaction(async (tx) => {
    await ensureUser(tx, hostUserId);

    let walletRecord = await tx.wallet.findUnique({ where: { xrplAddress: wallet.xrplAddress } });

    if (!walletRecord) {
      walletRecord = await tx.wallet.create({
        data: {
          xrplAddress: wallet.xrplAddress,
          publicKey: wallet.publicKey,
          encryptedSecret: wallet.encryptedSecret,
          label: wallet.label || `${title} Wallet`,
          ownerUserId: wallet.ownerUserId || hostUserId
        }
      });
    }

    const group = await tx.group.create({
      data: {
        hostUserId,
        title,
        description,
        groupWalletId: walletRecord.id
      }
    });

    await tx.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: hostUserId
        }
      },
      update: {
        role: 'HOST',
        status: 'ACTIVE'
      },
      create: {
        groupId: group.id,
        userId: hostUserId,
        role: 'HOST',
        status: 'ACTIVE',
        joinedAt: new Date()
      }
    });

    return tx.group.findUnique({
      where: { id: group.id },
      include: buildGroupInclude()
    });
  });
}

async function getGroupById(groupId) {
  if (!groupId) {
    throw createError(400, 'groupId는 필수입니다.');
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: buildGroupInclude()
  });

  if (!group) {
    throw createError(404, `Group not found for id=${groupId}`);
  }

  return group;
}

async function addMember({ groupId, userId, role = 'MEMBER', status = 'PENDING' }) {
  if (!groupId || !userId) {
    throw createError(400, 'groupId와 userId는 필수입니다.');
  }

  return prisma.$transaction(async (tx) => {
    await ensureGroup(tx, groupId);
    await ensureUser(tx, userId);

    return tx.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      },
      create: {
        groupId,
        userId,
        role,
        status,
        joinedAt: status === 'ACTIVE' ? new Date() : null
      },
      update: {
        role,
        status
      }
    });
  });
}

async function listGroupsForUser(userId) {
  if (!userId) {
    throw createError(400, 'userId는 필수입니다.');
  }

  return prisma.group.findMany({
    where: {
      members: {
        some: {
          userId
        }
      }
    },
    include: buildGroupInclude()
  });
}

module.exports = {
  createGroup,
  getGroupById,
  addMember,
  listGroupsForUser
};
