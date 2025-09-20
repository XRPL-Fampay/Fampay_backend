const express = require('express');
const {
  createGroup,
  fetchGroup,
  addGroupMember,
  listMyGroups,
  bootstrapGroupWallet
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
 *                 description: 미제공 시 서버에서 새로운 그룹 지갑을 생성합니다.
 *     responses:
 *       '201':
 *         description: 생성된 그룹 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *             examples:
 *               generated:
 *                 summary: 서버가 그룹 지갑을 새로 생성한 경우
 *                 value:
 *                   id: "grp_123"
 *                   title: "모임통장"
 *                   groupWallet:
 *                     xrplAddress: "rExampleAddress"
 *                   groupWalletProvisioning:
 *                     mnemonic: "word1 word2 ... word24"
 *                     seed: "sXXXXXXXXXXXXXXXXXXXX"
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

/**
 * @openapi
 * /groups/{groupId}/wallet/bootstrap:
 *   post:
 *     summary: 그룹 지갑 XRPL 부트스트랩 (Credential 발급, PermissionedDomain 생성, RLUSD 신뢰선 설정)
 *     tags:
 *       - Groups
 *     parameters:
 *       - name: groupId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               credentialType:
 *                 type: string
 *                 description: 발급할 Credential 타입 (기본값 KYC)
 *               credentialTtlSeconds:
 *                 type: integer
 *                 description: Credential 만료까지의 TTL (초)
 *               trustlineCurrency:
 *                 type: string
 *                 description: 신뢰선을 열 통화 (기본값 RLUSD)
 *               trustlineLimit:
 *                 type: string
 *                 description: 신뢰선 한도 값 (기본값 1000000)
 *               trustlineIssuer:
 *                 type: string
 *                 description: 신뢰선 발행자 주소 (미지정 시 그룹 호스트 주소 사용)
 *     responses:
 *       '200':
 *         description: XRPL 부트스트랩 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groupId:
 *                   type: string
 *                 issuerAccount:
 *                   type: string
 *                 credential:
 *                   type: object
 *                   properties:
 *                     issued:
 *                       type: array
 *                       items:
 *                         type: object
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: object
 *                 permissionedDomain:
 *                   type: object
 *                 trustline:
 *                   type: object
 */
router.post('/:groupId/wallet/bootstrap', bootstrapGroupWallet);
router.use('/:groupId/transactions', transactionsRouter);

module.exports = router;
