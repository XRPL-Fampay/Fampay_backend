const express = require('express');
const {
  createGroup,
  fetchGroup,
  addGroupMember,
  listMyGroups
} = require('../../controllers/groupController');
const transactionsRouter = require('./transactions');

const router = express.Router();

/**
 * @openapi
 * /groups:
 *   get:
 *     summary: 사용자가 속한 그룹 목록 조회
 *     tags:
 *       - Groups
 *     parameters:
 *       - name: userId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 그룹 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Group'
 */
router.get('/', listMyGroups);

/**
 * @openapi
 * /groups:
 *   post:
 *     summary: 그룹 생성 및 그룹 지갑 연결
 *     tags:
 *       - Groups
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hostUserId
 *               - title
 *               - wallet
 *             properties:
 *               hostUserId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               wallet:
 *                 type: object
 *                 properties:
 *                   xrplAddress:
 *                     type: string
 *                   publicKey:
 *                     type: string
 *                   encryptedSecret:
 *                     type: string
 *                   label:
 *                     type: string
 *     responses:
 *       '201':
 *         description: 생성된 그룹 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 */
router.post('/', createGroup);

/**
 * @openapi
 * /groups/{groupId}:
 *   get:
 *     summary: 그룹 상세 조회
 *     tags:
 *       - Groups
 *     parameters:
 *       - name: groupId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 그룹 상세 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 */
router.get('/:groupId', fetchGroup);

/**
 * @openapi
 * /groups/{groupId}/members:
 *   post:
 *     summary: 그룹 멤버 추가/업데이트
 *     tags:
 *       - Groups
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
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [HOST, ADMIN, MEMBER]
 *               status:
 *                 type: string
 *                 enum: [PENDING, ACTIVE, REMOVED]
 *     responses:
 *       '200':
 *         description: 멤버 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GroupMember'
 */
router.post('/:groupId/members', addGroupMember);
router.use('/:groupId/transactions', transactionsRouter);

module.exports = router;
