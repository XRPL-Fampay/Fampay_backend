const express = require('express');
const distributionController = require('../../controllers/distributionRuleController');
const { authenticate, requireRole } = require('../../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

router.use(authenticate);

/**
 * @openapi
 * /groups/{groupId}/distribution-rules:
 *   get:
 *     summary: 그룹 분배 규칙 목록
 *     tags:
 *       - Distribution Rules
 *     security:
 *       - bearerAuth: []
 */
router.get('/', distributionController.listRules);

/**
 * @openapi
 * /groups/{groupId}/distribution-rules:
 *   post:
 *     summary: 그룹 분배 규칙 생성
 *     tags:
 *       - Distribution Rules
 *     security:
 *       - bearerAuth: []
 */
router.post('/', requireRole('ADMIN'), distributionController.createRule);

/**
 * @openapi
 * /groups/{groupId}/distribution-rules/{ruleId}:
 *   patch:
 *     summary: 그룹 분배 규칙 수정
 *     tags:
 *       - Distribution Rules
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:ruleId', requireRole('ADMIN'), distributionController.updateRule);

/**
 * @openapi
 * /groups/{groupId}/distribution-rules/{ruleId}:
 *   delete:
 *     summary: 그룹 분배 규칙 삭제
 *     tags:
 *       - Distribution Rules
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:ruleId', requireRole('ADMIN'), distributionController.deleteRule);

module.exports = router;
