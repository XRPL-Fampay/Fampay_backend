const xrpl = require('xrpl');
const { prisma } = require('../db/prisma');
const config = require('../config');
const CryptoJS = require('crypto-js');
const createError = require('http-errors');
const xrplCredentialService = require('./xrplCredentialService');

function decryptSecret(encryptedData) {
  const bytes = CryptoJS.AES.decrypt(encryptedData, config.security.encryptionKey);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

class MultiSignatureService {
  constructor() {
    this.client = null;
  }

  async connect() {
    if (!this.client) {
      this.client = new xrpl.Client(config.xrpl.server || "wss://s.devnet.rippletest.net:51233");
      await this.client.connect();
    }
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }

  /**
   * Create a multi-signature transaction proposal
   * @param {Object} params
   * @param {string} params.groupId - Group ID
   * @param {string} params.proposedBy - User ID who proposed the transaction
   * @param {Object} params.transaction - Transaction data
   * @param {string} params.description - Description of the transaction
   */
  async createTransactionProposal({
    groupId,
    proposedBy,
    transaction,
    description
  }) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        groupWallet: true,
        members: {
          include: { user: true }
        }
      }
    });

    if (!group) {
      throw createError(404, 'Group not found');
    }

    // Create the base transaction
    await this.connect();
    const { seed } = decryptSecret(group.groupWallet.encryptedSecret);
    const wallet = xrpl.Wallet.fromSeed(seed);

    const tx = {
      ...transaction,
      Account: group.groupWallet.xrplAddress
    };

    const prepared = await this.client.autofill(tx);

    // Store the proposal in database
    const proposal = await prisma.multiSigProposal.create({
      data: {
        groupId,
        proposedById: proposedBy,
        transactionData: JSON.stringify(prepared),
        description,
        status: 'PENDING',
        requiredSignatures: group.members.filter(m => m.status === 'ACTIVE').length,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });

    return {
      proposalId: proposal.id,
      transaction: prepared,
      requiredSignatures: proposal.requiredSignatures,
      group: {
        id: group.id,
        title: group.title,
        members: group.members.filter(m => m.status === 'ACTIVE')
      }
    };
  }

  /**
   * Sign a multi-signature transaction proposal
   * @param {Object} params
   * @param {string} params.proposalId - Proposal ID
   * @param {string} params.userId - User ID signing the transaction
   * @param {string} params.userWalletSeed - User's wallet seed for signing
   */
  async signProposal({
    proposalId,
    userId,
    userWalletSeed
  }) {
    const proposal = await prisma.multiSigProposal.findUnique({
      where: { id: proposalId },
      include: {
        group: {
          include: {
            groupWallet: true,
            members: {
              include: { user: true }
            }
          }
        },
        signatures: true
      }
    });

    if (!proposal) {
      throw createError(404, 'Proposal not found');
    }

    if (proposal.status !== 'PENDING') {
      throw createError(400, 'Proposal is not pending');
    }

    if (new Date() > proposal.expiresAt) {
      throw createError(400, 'Proposal has expired');
    }

    // Check if user is a group member
    const member = proposal.group.members.find(m => m.userId === userId && m.status === 'ACTIVE');
    if (!member) {
      throw createError(403, 'User is not an active member of the group');
    }

    // Check if user already signed
    const existingSignature = proposal.signatures.find(s => s.signerId === userId);
    if (existingSignature) {
      throw createError(400, 'User has already signed this proposal');
    }

    // Verify user has valid credential
    const userWallet = xrpl.Wallet.fromSeed(userWalletSeed);
    const credentialCheck = await xrplCredentialService.checkCredential(
      userWallet.address,
      proposal.group.groupWallet.xrplAddress,
      "GROUP_MEMBER"
    );

    if (!credentialCheck.hasValidCredential) {
      throw createError(403, 'User does not have valid group membership credential');
    }

    // Create signature
    const transactionData = JSON.parse(proposal.transactionData);
    const signed = userWallet.sign(transactionData);

    // Store signature
    await prisma.multiSigSignature.create({
      data: {
        proposalId,
        signerId: userId,
        signature: signed.tx_blob,
        signerAddress: userWallet.address
      }
    });

    // Check if we have enough signatures
    const totalSignatures = proposal.signatures.length + 1; // +1 for the new signature
    const canExecute = totalSignatures >= proposal.requiredSignatures;

    if (canExecute) {
      // Update proposal status
      await prisma.multiSigProposal.update({
        where: { id: proposalId },
        data: { status: 'READY_TO_EXECUTE' }
      });
    }

    return {
      proposalId,
      signed: true,
      totalSignatures,
      requiredSignatures: proposal.requiredSignatures,
      canExecute,
      signature: signed.tx_blob
    };
  }

  /**
   * Execute a multi-signature transaction
   * @param {string} proposalId - Proposal ID
   */
  async executeProposal(proposalId) {
    const proposal = await prisma.multiSigProposal.findUnique({
      where: { id: proposalId },
      include: {
        group: {
          include: { groupWallet: true }
        },
        signatures: true
      }
    });

    if (!proposal) {
      throw createError(404, 'Proposal not found');
    }

    if (proposal.status !== 'READY_TO_EXECUTE') {
      throw createError(400, 'Proposal is not ready to execute');
    }

    if (proposal.signatures.length < proposal.requiredSignatures) {
      throw createError(400, 'Not enough signatures');
    }

    await this.connect();

    try {
      // Get the group wallet for final signing
      const { seed } = decryptSecret(proposal.group.groupWallet.encryptedSecret);
      const groupWallet = xrpl.Wallet.fromSeed(seed);

      // Parse and sign the transaction with group wallet
      const transactionData = JSON.parse(proposal.transactionData);
      const signed = groupWallet.sign(transactionData);

      // Submit the transaction
      const result = await this.client.submitAndWait(signed.tx_blob);

      // Update proposal status
      await prisma.multiSigProposal.update({
        where: { id: proposalId },
        data: {
          status: 'EXECUTED',
          executedAt: new Date(),
          transactionHash: result.result.hash
        }
      });

      return {
        success: result.result.meta.TransactionResult === 'tesSUCCESS',
        transactionHash: result.result.hash,
        proposalId,
        result: result.result
      };
    } catch (error) {
      // Update proposal status to failed
      await prisma.multiSigProposal.update({
        where: { id: proposalId },
        data: {
          status: 'FAILED',
          executedAt: new Date(),
          errorMessage: error.message
        }
      });

      throw error;
    }
  }

  /**
   * Get proposal details
   * @param {string} proposalId - Proposal ID
   */
  async getProposal(proposalId) {
    const proposal = await prisma.multiSigProposal.findUnique({
      where: { id: proposalId },
      include: {
        group: {
          include: {
            groupWallet: true,
            members: {
              include: { user: true }
            }
          }
        },
        signatures: {
          include: { signer: true }
        },
        proposedBy: true
      }
    });

    if (!proposal) {
      throw createError(404, 'Proposal not found');
    }

    return {
      ...proposal,
      transactionData: JSON.parse(proposal.transactionData),
      canExecute: proposal.signatures.length >= proposal.requiredSignatures && proposal.status === 'PENDING'
    };
  }

  /**
   * List proposals for a group
   * @param {string} groupId - Group ID
   * @param {string} status - Optional status filter
   */
  async listGroupProposals(groupId, status = null) {
    const where = { groupId };
    if (status) {
      where.status = status;
    }

    const proposals = await prisma.multiSigProposal.findMany({
      where,
      include: {
        signatures: {
          include: { signer: true }
        },
        proposedBy: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return proposals.map(proposal => ({
      ...proposal,
      transactionData: JSON.parse(proposal.transactionData)
    }));
  }
}

module.exports = new MultiSignatureService();