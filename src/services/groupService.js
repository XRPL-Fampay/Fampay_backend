const createError = require('http-errors');
const CryptoJS = require('crypto-js');
const xrpl = require('xrpl');
const { prisma } = require('../db/prisma');
const config = require('../config');
const xrplCredentialService = require('./xrplCredentialService');

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
  console.log('🔍 resolveGroupWallet called with:', {
    hasWallet: !!wallet,
    walletXrplAddress: wallet?.xrplAddress,
    title
  });
  
  if (wallet?.xrplAddress) {
    console.log('📋 Using existing wallet:', wallet.xrplAddress);
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

  console.log('🆕 Generating new wallet...');
  const generatedWallet = xrpl.Wallet.generate();
  const encryptedSecret = encryptSecret({ seed: generatedWallet.seed });
  
  console.log('🆕 New wallet generated:', {
    address: generatedWallet.classicAddress,
    hasSeed: !!generatedWallet.seed,
    seed: generatedWallet.seed ? '[HAS_SEED]' : '[NO_SEED]'
  });

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
    mnemonic: null, // Not using mnemonic anymore, using direct generation
    seed: generatedWallet.seed
  };
}

async function createGroup({ hostUserId, title, description, wallet, memberAddresses = [] }) {
  if (!title) {
    throw createError(400, 'title은 필수입니다.');
  }

  // Create or get user from env
  const defaultUserId = hostUserId || 'default-user';

  return prisma.$transaction(async (tx) => {
    // Create user if not exists
    const user = await tx.user.upsert({
      where: { id: defaultUserId },
      update: {},
      create: {
        id: defaultUserId,
        fullName: 'Default User',
        email: 'default@example.com'
      }
    });

    const walletResult = await resolveGroupWallet(tx, {
      hostUserId: defaultUserId,
      title,
      wallet
    });
    
    console.log('🔍 Wallet result:', {
      hasMnemonic: !!walletResult.mnemonic,
      hasSeed: !!walletResult.seed,
      walletAddress: walletResult.walletRecord.xrplAddress
    });
    
    const { walletRecord, mnemonic, seed } = walletResult;

    const group = await tx.group.create({
      data: {
        hostUserId: defaultUserId,
        title,
        description,
        groupWalletId: walletRecord.id
      }
    });

    await tx.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: defaultUserId
        }
      },
      update: {
        role: 'HOST',
        status: 'ACTIVE'
      },
      create: {
        groupId: group.id,
        userId: defaultUserId,
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

    console.log('🏦 Group wallet created:', {
      groupId: group.id,
      title: group.title,
      walletAddress: groupWithRelations.groupWallet.xrplAddress,
      memberCount: memberAddresses.length,
      memberAddresses: memberAddresses,
      seed: seed ? '[HAS_SEED]' : '[NO_SEED]',
      mnemonic: mnemonic ? '[GENERATED]' : '[PROVIDED]'
    });

    // Create permissioned domain for group wallet access control
    // Get seed from wallet (either from generation or decryption)
    let walletSeed = seed;
    if (!walletSeed && groupWithRelations.groupWallet.encryptedSecret) {
      try {
        const decryptedData = CryptoJS.AES.decrypt(
          groupWithRelations.groupWallet.encryptedSecret, 
          config.security.encryptionKey
        );
        const { seed: decryptedSeed } = JSON.parse(decryptedData.toString(CryptoJS.enc.Utf8));
        walletSeed = decryptedSeed;
      } catch (error) {
        console.error('❌ Failed to decrypt wallet seed:', error);
      }
    }

    console.log('🔍 Checking credential creation conditions:', {
      hasSeed: !!walletSeed,
      memberCount: memberAddresses.length,
      memberAddresses: memberAddresses
    });
    
    if (walletSeed && memberAddresses.length > 0) {
      try {
        console.log('🔐 Creating permissioned domain for group:', group.id);
        const domainResult = await xrplCredentialService.createPermissionedDomain({
          issuerSeed: walletSeed,
          acceptedCredentials: [{ credentialType: "GROUP_MEMBER" }]
        });

        if (domainResult.success) {
          console.log('✅ Permissioned domain created:', {
            domainId: domainResult.domainId,
            transactionHash: domainResult.transactionHash
          });
          
          // Issue credentials to all members
          console.log('📜 Issuing credentials to members:', memberAddresses);
          const credentialResults = await xrplCredentialService.createGroupMemberCredentials({
            groupWalletSeed: walletSeed,
            memberAddresses: memberAddresses,
            groupId: group.id
          });

          const successCount = credentialResults.filter(r => r.success).length;
          console.log('📜 Credential results:', {
            total: credentialResults.length,
            successful: successCount,
            failed: credentialResults.length - successCount,
            details: credentialResults.map(r => ({
              address: r.memberAddress,
              success: r.success,
              transactionHash: r.transactionHash || r.error
            }))
          });

          // Store credential results in logs instead of response object
          console.log('💾 Credential results stored for group:', group.id);
        }
      } catch (error) {
        console.error('❌ Failed to create credentials for group:', error);
        // Don't fail group creation if credentials fail
      }
    } else if (memberAddresses.length === 0) {
      console.log('ℹ️ No member addresses provided, skipping credential creation');
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
