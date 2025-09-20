const createError = require('http-errors');
const { prisma } = require('../db/prisma');

async function ensureGroup(groupId) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    throw createError(404, `Group not found for id=${groupId}`);
  }
  return group;
}

async function ensureUser(userId) {
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw createError(404, `User not found for id=${userId}`);
  }
  return user;
}

function normalizeDomain(domain) {
  if (!domain) {
    throw createError(400, 'domain은 필수입니다.');
  }
  return domain.trim().toLowerCase();
}

async function createPermissionedDomain({ groupId, domain, label, createdById }) {
  await ensureGroup(groupId);
  if (createdById) {
    await ensureUser(createdById);
  }

  const normalized = normalizeDomain(domain);

  return prisma.permissionedDomain.create({
    data: {
      groupId,
      domain: normalized,
      label,
      createdById
    }
  });
}

async function listPermissionedDomains(groupId) {
  await ensureGroup(groupId);
  return prisma.permissionedDomain.findMany({
    where: { groupId },
    orderBy: { createdAt: 'desc' }
  });
}

async function verifyPermissionedDomain({ groupId, domainId, verified }) {
  if (!domainId) {
    throw createError(400, 'permissionedDomainId는 필수입니다.');
  }

  await ensureGroup(groupId);

  return prisma.permissionedDomain.update({
    where: { id: domainId },
    data: {
      verifiedAt: verified ? new Date() : null
    }
  });
}

async function removePermissionedDomain({ groupId, domainId }) {
  if (!domainId) {
    throw createError(400, 'permissionedDomainId는 필수입니다.');
  }

  await ensureGroup(groupId);

  await prisma.permissionedDomain.delete({ where: { id: domainId } });
  return { success: true };
}

module.exports = {
  createPermissionedDomain,
  listPermissionedDomains,
  verifyPermissionedDomain,
  removePermissionedDomain
};
