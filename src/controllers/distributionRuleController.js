const createError = require('http-errors');
const distributionService = require('../services/distributionRuleService');

async function createRule(req, res, next) {
  try {
    const { groupId } = req.params;
    const { name, splits, isActive } = req.body || {};
    if (!splits) {
      throw createError(400, 'splits가 필요합니다.');
    }
    const rule = await distributionService.createRule({ groupId, name, splits, isActive });
    res.status(201).json(rule);
  } catch (error) {
    next(error);
  }
}

async function listRules(req, res, next) {
  try {
    const { groupId } = req.params;
    const rules = await distributionService.listRules(groupId);
    res.status(200).json(rules);
  } catch (error) {
    next(error);
  }
}

async function updateRule(req, res, next) {
  try {
    const { ruleId } = req.params;
    const { name, splits, isActive } = req.body || {};
    const rule = await distributionService.updateRule({ ruleId, name, splits, isActive });
    res.status(200).json(rule);
  } catch (error) {
    next(error);
  }
}

async function deleteRule(req, res, next) {
  try {
    const { ruleId } = req.params;
    const result = await distributionService.deleteRule(ruleId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createRule,
  listRules,
  updateRule,
  deleteRule
};
