const createError = require('http-errors');
const cashoutService = require('../services/cashoutGatewayService');

function resolveGroupId(req) {
  const groupId = req.params.groupId || req.body?.groupId || req.query.groupId;
  if (!groupId) {
    throw createError(400, 'groupId가 필요합니다.');
  }
  return groupId;
}

async function setupDomain(req, res, next) {
  try {
    const groupId = resolveGroupId(req);
    const record = await cashoutService.setupDomain({
      groupId,
      domain: req.body?.domain,
      label: req.body?.label,
      createdById: req.user.id
    });
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
}

async function listDomains(req, res, next) {
  try {
    const groupId = resolveGroupId(req);
    const domains = await cashoutService.listDomains(groupId);
    res.status(200).json(domains);
  } catch (error) {
    next(error);
  }
}

async function registerGateway(req, res, next) {
  try {
    const groupId = resolveGroupId(req);
    const gateway = await cashoutService.registerGateway({
      groupId,
      provider: req.body?.provider,
      domain: req.body?.domain,
      metadata: req.body?.metadata
    });
    res.status(201).json(gateway);
  } catch (error) {
    next(error);
  }
}

async function listGateways(req, res, next) {
  try {
    const groupId = resolveGroupId(req);
    const gateways = await cashoutService.listGateways(groupId);
    res.status(200).json(gateways);
  } catch (error) {
    next(error);
  }
}

async function verifyDomain(req, res, next) {
  try {
    const groupId = resolveGroupId(req);
    const { domainId } = req.params;
    const domain = await cashoutService.verifyDomain({ groupId, domainId, verified: req.body?.verified });
    res.status(200).json(domain);
  } catch (error) {
    next(error);
  }
}

async function removeDomain(req, res, next) {
  try {
    const { domainId } = req.params;
    const result = await cashoutService.removeDomain({ domainId });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function requestCashout(req, res, next) {
  try {
    const groupId = resolveGroupId(req);
    const request = await cashoutService.createCashoutRequest({
      groupId,
      memberId: req.body?.memberId || req.user.id,
      amountDrops: req.body?.amountDrops,
      targetDomainId: req.body?.targetDomainId
    });
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
}

async function processRequest(req, res, next) {
  try {
    const { requestId } = req.params;
    const request = await cashoutService.processCashoutRequest({
      requestId,
      approved: req.body?.approved,
      operatorId: req.user.id
    });
    res.status(200).json(request);
  } catch (error) {
    next(error);
  }
}

async function getStatus(req, res, next) {
  try {
    const { requestId } = req.params;
    const status = await cashoutService.getRequestStatus(requestId);
    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
}

async function createReceipt(req, res, next) {
  try {
    const { requestId } = req.params;
    const receipt = await cashoutService.issueReceipt(requestId);
    res.status(200).json(receipt);
  } catch (error) {
    next(error);
  }
}

async function getReceipt(req, res, next) {
  try {
    const { receiptId } = req.params;
    const receipt = await cashoutService.getReceipt(receiptId);
    res.status(200).json(receipt);
  } catch (error) {
    next(error);
  }
}

async function bankTransfer(req, res, next) {
  try {
    const { requestId } = req.params;
    const result = await cashoutService.bankTransfer({
      requestId,
      bankInfo: req.body
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function mobileMoney(req, res, next) {
  try {
    const { requestId } = req.params;
    const result = await cashoutService.mobileMoneyTransfer({
      requestId,
      provider: req.body?.provider,
      phoneNumber: req.body?.phoneNumber
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  setupDomain,
  listDomains,
  verifyDomain,
  removeDomain,
  registerGateway,
  listGateways,
  requestCashout,
  processRequest,
  getStatus,
  createReceipt,
  getReceipt,
  bankTransfer,
  mobileMoney
};
