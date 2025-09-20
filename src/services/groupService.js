const createError = require('http-errors');
const bip39 = require('bip39');
const CryptoJS = require('crypto-js');
const xrpl = require('xrpl');
const { prisma } = require('../db/prisma');
const config = require('../config');

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

function encryptSecret(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), config.security.encryptionKey).toString();
}

async function resolveGroupWallet(tx, { hostUserId, title, wallet }) {
  if (wallet?.xrplAddress) {
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

    return {
      walletRecord,
      mnemonic: null,
      seed: null
    };
  }

  const mnemonic = bip39.generateMnemonic(256);
  const generatedWallet = xrpl.Wallet.fromMnemonic(mnemonic, { algorithm: 'secp256k1' });
  const encryptedSecret = encryptSecret({ seed: generatedWallet.seed });

  const walletRecord = await tx.wallet.create({
    data: {
      xrplAddress: generatedWallet.classicAddress,
      publicKey: generatedWallet.publicKey,
      encryptedSecret,
      label: `${title} Wallet`,
      ownerUserId: hostUserId
    }
  });

  return {
    walletRecord,
    mnemonic,
    seed: generatedWallet.seed
  };
}

async function createGroup({ hostUserId, title, description, wallet }) {
  if (!hostUserId || !title) {
    throw createError(400, 'hostUserId와 title은 필수입니다.');
  }

  return prisma.$transaction(async (tx) => {
    await ensureUser(tx, hostUserId);

    const { walletRecord, mnemonic, seed } = await resolveGroupWallet(tx, {
      hostUserId,
      title,
      wallet
    });

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

    const groupWithRelations = await tx.group.findUnique({
      where: { id: group.id },
      include: buildGroupInclude()
    });

    if (mnemonic) {
      groupWithRelations.groupWalletProvisioning = {
        mnemonic,
        seed
      };
    }

    return groupWithRelations;
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
