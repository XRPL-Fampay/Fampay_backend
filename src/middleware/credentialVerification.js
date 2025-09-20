const createError = require('http-errors');
const xrplCredentialService = require('../services/xrplCredentialService');
const { getGroupById } = require('../services/groupService');

/**
 * Middleware to verify that a user has valid group membership credentials
 * @param {Object} options
 * @param {string} options.credentialType - Type of credential to verify (default: "GROUP_MEMBER")
 * @param {string} options.userAddressParam - Request parameter containing user address (default: "userAddress")
 * @param {string} options.groupIdParam - Request parameter containing group ID (default: "groupId")
 */
function verifyGroupCredential(options = {}) {
  const {
    credentialType = "GROUP_MEMBER",
    userAddressParam = "userAddress",
    groupIdParam = "groupId"
  } = options;

  return async (req, res, next) => {
    try {
      const groupId = req.params[groupIdParam] || req.body[groupIdParam] || req.query[groupIdParam];
      const userAddress = req.params[userAddressParam] || req.body[userAddressParam] || req.query[userAddressParam];

      if (!groupId) {
        return next(createError(400, `${groupIdParam} is required`));
      }

      if (!userAddress) {
        return next(createError(400, `${userAddressParam} is required`));
      }

      // Get group and issuer address
      const group = await getGroupById(groupId);
      const issuerAddress = group.groupWallet.xrplAddress;

      // Verify credential
      const credentialCheck = await xrplCredentialService.checkCredential(
        userAddress,
        issuerAddress,
        credentialType
      );

      if (!credentialCheck.hasValidCredential) {
        return next(createError(403, `User does not have valid ${credentialType} credential for this group`));
      }

      // Add credential info to request for downstream use
      req.verifiedCredential = {
        groupId,
        userAddress,
        credentialType,
        credential: credentialCheck.credential
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to verify group membership without requiring specific credentials
 * Just checks if user is an active member of the group
 */
function verifyGroupMembership() {
  return async (req, res, next) => {
    try {
      const groupId = req.params.groupId || req.body.groupId || req.query.groupId;
      const userId = req.params.userId || req.body.userId || req.query.userId;

      if (!groupId) {
        return next(createError(400, 'groupId is required'));
      }

      if (!userId) {
        return next(createError(400, 'userId is required'));
      }

      // Get group with members
      const group = await getGroupById(groupId);
      const member = group.members.find(m => m.userId === userId && m.status === 'ACTIVE');

      if (!member) {
        return next(createError(403, 'User is not an active member of this group'));
      }

      // Add membership info to request
      req.groupMembership = {
        groupId,
        userId,
        member,
        group
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to verify that a user has admin or host privileges in a group
 */
function verifyGroupAdmin() {
  return async (req, res, next) => {
    try {
      const groupId = req.params.groupId || req.body.groupId || req.query.groupId;
      const userId = req.params.userId || req.body.userId || req.query.userId;

      if (!groupId) {
        return next(createError(400, 'groupId is required'));
      }

      if (!userId) {
        return next(createError(400, 'userId is required'));
      }

      // Get group with members
      const group = await getGroupById(groupId);
      const member = group.members.find(m => m.userId === userId && m.status === 'ACTIVE');

      if (!member) {
        return next(createError(403, 'User is not an active member of this group'));
      }

      if (member.role !== 'HOST' && member.role !== 'ADMIN') {
        return next(createError(403, 'User does not have admin privileges in this group'));
      }

      // Add admin info to request
      req.groupAdmin = {
        groupId,
        userId,
        member,
        group,
        isHost: member.role === 'HOST'
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Combine credential verification with membership check
 */
function verifyCredentialAndMembership(options = {}) {
  return [
    verifyGroupMembership(),
    verifyGroupCredential(options)
  ];
}

module.exports = {
  verifyGroupCredential,
  verifyGroupMembership,
  verifyGroupAdmin,
  verifyCredentialAndMembership
};