const createError = require('http-errors');
const {
  createGroup: createGroupService,
  getGroupById,
  addMember,
  listGroupsForUser
} = require('../services/groupService');
const {
  bootstrapGroupWallet: bootstrapGroupWalletService
} = require('../services/groupWalletBootstrapService');

async function createGroup(req, res, next) {
  try {
    const { hostUserId, title, description, wallet } = req.body || {};
    const group = await createGroupService({ hostUserId, title, description, wallet });
    res.status(201).json(group);
  } catch (error) {
    next(error);
  }
}

async function fetchGroup(req, res, next) {
  try {
    const { groupId } = req.params;
    const group = await getGroupById(groupId);
    res.status(200).json(group);
  } catch (error) {
    next(error);
  }
}

async function addGroupMember(req, res, next) {
  try {
    const { groupId } = req.params;
    const { userId, role, status } = req.body || {};

    if (!userId) {
      throw createError(400, 'userId는 필수입니다.');
    }

    const member = await addMember({ groupId, userId, role, status });
    res.status(200).json(member);
  } catch (error) {
    next(error);
  }
}

async function listMyGroups(req, res, next) {
  try {
    const { userId } = req.query;
    if (!userId) {
      throw createError(400, 'userId 쿼리 파라미터가 필요합니다.');
    }

    const groups = await listGroupsForUser(userId);
    res.status(200).json(groups);
  } catch (error) {
    next(error);
  }
}

async function bootstrapGroupWallet(req, res, next) {
  try {
    const { groupId } = req.params;
    const {
      credentialType,
      credentialTtlSeconds,
      trustlineCurrency,
      trustlineLimit,
      trustlineIssuer
    } = req.body || {};

    const result = await bootstrapGroupWalletService({
      groupId,
      credentialType,
      credentialTtlSeconds,
      trustlineCurrency,
      trustlineLimit,
      trustlineIssuer
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createGroup,
  fetchGroup,
  addGroupMember,
  listMyGroups,
  bootstrapGroupWallet
};
