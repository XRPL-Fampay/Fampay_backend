const {
  createPermissionedDomain,
  listPermissionedDomains,
  verifyPermissionedDomain,
  removePermissionedDomain
} = require('../services/permissionedDomainService');

async function createDomain(req, res, next) {
  try {
    const { groupId } = req.params;
    const domain = await createPermissionedDomain({
      groupId,
      ...req.body
    });
    res.status(201).json(domain);
  } catch (error) {
    next(error);
  }
}

async function listDomains(req, res, next) {
  try {
    const { groupId } = req.params;
    const domains = await listPermissionedDomains(groupId);
    res.status(200).json(domains);
  } catch (error) {
    next(error);
  }
}

async function verifyDomain(req, res, next) {
  try {
    const { groupId, domainId } = req.params;
    const { verified = true } = req.body || {};
    const domain = await verifyPermissionedDomain({ groupId, domainId, verified });
    res.status(200).json(domain);
  } catch (error) {
    next(error);
  }
}

async function deleteDomain(req, res, next) {
  try {
    const { groupId, domainId } = req.params;
    const result = await removePermissionedDomain({ groupId, domainId });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createDomain,
  listDomains,
  verifyDomain,
  deleteDomain
};
