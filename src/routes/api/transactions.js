const express = require('express');
const {
  createGroupTransaction,
  updateGroupTransaction,
  listTransactions,
  createPlan,
  updatePlan,
  listGroupPlans
} = require('../../controllers/transactionController');

const router = express.Router({ mergeParams: true });

/**
 * @openapi
 * /groups/{groupId}/transactions:
 *   get:
 *     summary: 그룹 트랜잭션 목록 조회
 *     tags:
 *       - Transactions
 *     parameters:
 *       - name: groupId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *       - name: cursor
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 그룹 트랜잭션 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 */
router.get('/', listTransactions);

/**
 * @openapi
 * /groups/{groupId}/transactions:
 *   post:
 *     summary: 그룹 트랜잭션 생성 (Payment/Batch/Escrow 메타 저장)
 *     tags:
 *       - Transactions
 *     parameters:
 *       - name: groupId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - amountDrops
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [CONTRIBUTION, PAYOUT, ESCROW_CREATE, ESCROW_FINISH, ESCROW_CANCEL, BATCH]
 *               amountDrops:
 *                 type: string
 *               currency:
 *                 type: string
 *               sourceWalletId:
 *                 type: string
 *               destinationWalletId:
 *                 type: string
 *               memo:
 *                 type: string
 *               recurringPlanId:
 *                 type: string
 *               xrpl:
 *                 type: object
 *                 description: 실제 XRPL 트랜잭션 실행 옵션
 *                 properties:
 *                   execute:
 *                     type: boolean
 *                   seed:
 *                     type: string
 *                   destination:
 *                     type: string
 *                   amountDrops:
 *                     type: string
 *                   amountXrp:
 *                     type: string
 *                   issuer:
 *                     type: string
 *                   finishAfter:
 *                     oneOf:
 *                       - type: string
 *                         format: date-time
 *                       - type: integer
 *                   cancelAfter:
 *                     oneOf:
 *                       - type: string
 *                         format: date-time
 *                       - type: integer
 *                   condition:
 *                     type: string
 *                   fulfillment:
 *                     type: string
 *                   owner:
 *                     type: string
 *                   offerSequence:
 *                     type: integer
 *     responses:
 *       '201':
 *         description: 생성된 트랜잭션
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 */
router.post('/', createGroupTransaction);

/**
 * @openapi
 * /groups/{groupId}/transactions/{transactionId}:
 *   patch:
 *     summary: 트랜잭션 상태 업데이트 (확정, 실패 등)
 *     tags:
 *       - Transactions
 *     parameters:
 *       - name: groupId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: transactionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, FAILED]
 *               confirmedAt:
 *                 type: string
 *                 format: date-time
 *               xrplHash:
 *                 type: string
 *     responses:
 *       '200':
 *         description: 업데이트된 트랜잭션
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 */
router.patch('/:transactionId', updateGroupTransaction);

/**
 * @openapi
 * /groups/{groupId}/transactions/plans/list:
 *   get:
 *     summary: 정기 납부/지급 계획 목록
 *     tags:
 *       - Recurring Plans
 *     parameters:
 *       - name: groupId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 정기 계획 리스트
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RecurringPlan'
 */
router.get('/plans/list', listGroupPlans);

/**
 * @openapi
 * /groups/{groupId}/transactions/plans:
 *   post:
 *     summary: 정기 납부/지급 계획 생성
 *     tags:
 *       - Recurring Plans
 *     parameters:
 *       - name: groupId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - createdById
 *               - type
 *               - amountDrops
 *               - scheduleCron
 *             properties:
 *               createdById:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [CONTRIBUTION, PAYOUT]
 *               amountDrops:
 *                 type: string
 *               currency:
 *                 type: string
 *               scheduleCron:
 *                 type: string
 *               memo:
 *                 type: string
 *               destinationWalletId:
 *                 type: string
 *               escrowReleaseAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       '201':
 *         description: 생성된 정기 계획
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecurringPlan'
 */
router.post('/plans', createPlan);

/**
 * @openapi
 * /groups/{groupId}/transactions/plans/{planId}:
 *   patch:
 *     summary: 정기 계획 상태/메타 업데이트
 *     tags:
 *       - Recurring Plans
 *     parameters:
 *       - name: groupId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: planId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, PAUSED, CANCELLED]
 *               memo:
 *                 type: string
 *               scheduleCron:
 *                 type: string
 *     responses:
 *       '200':
 *         description: 업데이트된 정기 계획
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecurringPlan'
 */
router.patch('/plans/:planId', updatePlan);

module.exports = router;
