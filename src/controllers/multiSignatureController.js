const createError = require('http-errors');
const multiSignatureService = require('../services/multiSignatureService');

async function createProposal(req, res, next) {
  try {
    const { groupId } = req.params;
    const { proposedBy, transaction, description } = req.body;

    if (!proposedBy || !transaction) {
      throw createError(400, 'proposedBy and transaction are required');
    }

    const result = await multiSignatureService.createTransactionProposal({
      groupId,
      proposedBy,
      transaction,
      description
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function signProposal(req, res, next) {
  try {
    const { proposalId } = req.params;
    const { userId, userWalletSeed } = req.body;

    if (!userId || !userWalletSeed) {
      throw createError(400, 'userId and userWalletSeed are required');
    }

    const result = await multiSignatureService.signProposal({
      proposalId,
      userId,
      userWalletSeed
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function executeProposal(req, res, next) {
  try {
    const { proposalId } = req.params;

    const result = await multiSignatureService.executeProposal(proposalId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getProposal(req, res, next) {
  try {
    const { proposalId } = req.params;

    const proposal = await multiSignatureService.getProposal(proposalId);

    res.status(200).json(proposal);
  } catch (error) {
    next(error);
  }
}

async function listGroupProposals(req, res, next) {
  try {
    const { groupId } = req.params;
    const { status } = req.query;

    const proposals = await multiSignatureService.listGroupProposals(groupId, status);

    res.status(200).json(proposals);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProposal,
  signProposal,
  executeProposal,
  getProposal,
  listGroupProposals
};