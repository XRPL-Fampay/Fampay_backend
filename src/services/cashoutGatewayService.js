const crypto = require('crypto');
const createError = require('http-errors');
const { prisma } = require('../db/prisma');

async function setupDomain({ groupId, domain, label, createdById }) {
  if (!domain) {
    throw createError(400, 'domain은 필수입니다.');
  }
  const normalized = domain.trim().toLowerCase();
  const record = await prisma.permissionedDomain.upsert({
    where: {
      groupId_domain: {
        groupId,
        domain: normalized
      }
    },
    update: {
      label,
      createdById
    },
    create: {
      groupId,
      domain: normalized,
      label,
      createdById
    }
  });
  return record;
}

async function listDomains(groupId) {
  return prisma.permissionedDomain.findMany({
    where: { groupId },
    orderBy: { createdAt: 'desc' }
  });
}

async function verifyDomain({ groupId, domainId, verified }) {
  const domain = await prisma.permissionedDomain.update({
    where: { id: domainId },
    data: { verifiedAt: verified ? new Date() : null }
  });
  return domain;
}

async function removeDomain({ domainId }) {
  await prisma.permissionedDomain.delete({ where: { id: domainId } });
  return { success: true };
}

async function registerGateway({ groupId, provider, domain, metadata }) {
  if (!provider || !domain) {
    throw createError(400, 'provider와 domain이 필요합니다.');
  }
  const gateway = await prisma.approvedGateway.upsert({
    where: {
      groupId_provider_domain: {
        groupId,
        provider,
        domain
      }
    },
    update: {
      metadata
    },
    create: {
      groupId,
      provider,
      domain,
      metadata
    }
  });
  return gateway;
}

async function listGateways(groupId) {
  return prisma.approvedGateway.findMany({
    where: { groupId },
    orderBy: { createdAt: 'desc' }
  });
}

async function createCashoutRequest({ groupId, memberId, amountDrops, targetDomainId }) {
  if (!amountDrops || !targetDomainId) {
    throw createError(400, 'amountDrops와 targetDomainId가 필요합니다.');
  }
  const request = await prisma.cashoutRequest.create({
    data: {
      groupId,
      memberId,
      requestedAmountDrops: amountDrops,
      targetDomainId
    }
  });
  return request;
}

async function processCashoutRequest({ requestId, approved, operatorId }) {
  const request = await prisma.cashoutRequest.findUnique({
    where: { id: requestId },
    include: {
      targetDomain: true
    }
  });
  if (!request) {
    throw createError(404, '현금화 요청을 찾을 수 없습니다.');
  }

  const status = approved ? 'FULFILLED' : 'REJECTED';
  const updated = await prisma.cashoutRequest.update({
    where: { id: requestId },
    data: {
      status,
      resolvedAt: new Date()
    }
  });

  if (approved) {
    const receiptHash = crypto.createHash('sha256').update(`${requestId}-${Date.now()}`).digest('hex');
    await prisma.cashoutReceipt.create({
      data: {
        requestId,
        hash: receiptHash
      }
    });
  }

  return updated;
}

async function getRequestStatus(requestId) {
  const request = await prisma.cashoutRequest.findUnique({
    where: { id: requestId },
    include: {
      receipt: true
    }
  });
  if (!request) {
    throw createError(404, '현금화 요청을 찾을 수 없습니다.');
  }
  return request;
}

async function getReceipt(receiptId) {
  const receipt = await prisma.cashoutReceipt.findUnique({
    where: { id: receiptId },
    include: {
      request: true
    }
  });
  if (!receipt) {
    throw createError(404, '영수증을 찾을 수 없습니다.');
  }
  return receipt;
}

async function issueReceipt(requestId) {
  const request = await prisma.cashoutRequest.findUnique({ where: { id: requestId }, include: { receipt: true } });
  if (!request) {
    throw createError(404, '현금화 요청을 찾을 수 없습니다.');
  }
  if (request.status !== 'FULFILLED') {
    throw createError(400, '완료된 요청만 영수증을 발행할 수 있습니다.');
  }
  if (request.receipt) {
    return request.receipt;
  }
  const receiptHash = crypto.createHash('sha256').update(`${requestId}-${Date.now()}`).digest('hex');
  const receipt = await prisma.cashoutReceipt.create({
    data: {
      requestId,
      hash: receiptHash
    }
  });
  return receipt;
}

async function bankTransfer({ requestId, bankInfo }) {
  if (!bankInfo?.accountNumber) {
    throw createError(400, '은행 계좌 정보가 필요합니다.');
  }
  return processCashoutRequest({ requestId, approved: true, operatorId: 'system' });
}

async function mobileMoneyTransfer({ requestId, provider, phoneNumber }) {
  if (!provider || !phoneNumber) {
    throw createError(400, '모바일머니 정보가 필요합니다.');
  }
  return processCashoutRequest({ requestId, approved: true, operatorId: 'system' });
}

module.exports = {
  setupDomain,
  listDomains,
  verifyDomain,
  removeDomain,
  registerGateway,
  listGateways,
  createCashoutRequest,
  processCashoutRequest,
  getRequestStatus,
  getReceipt,
  issueReceipt,
  bankTransfer,
  mobileMoneyTransfer
};
