const express = require('express');
const {
  createProposal,
  signProposal,
  executeProposal,
  getProposal,
  listGroupProposals
} = require('../../controllers/multiSignatureController');
const {
  verifyGroupMembership,
  verifyGroupAdmin
} = require('../../middleware/credentialVerification');

const router = express.Router({ mergeParams: true });

/**
 * @openapi
 * /groups/{groupId}/multisig/proposals:
 *   get:
 *     summary: 그룹의 다중 서명 제안 목록 조회
 *     tags:
 *       - Multi-Signature
 *     parameters:
 *       - name: groupId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [PENDING, READY_TO_EXECUTE, EXECUTED, FAILED, CANCELLED]
 *     responses:
 *       '200':
 *         description: 제안 목록
 */
router.get('/proposals', verifyGroupMembership(), listGroupProposals);

/**
 * @openapi
 * /groups/{groupId}/multisig/proposals:
 *   post:
 *     summary: 새로운 다중 서명 트랜잭션 제안 생성
 *     tags:
 *       - Multi-Signature
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
 *               - proposedBy
 *               - transaction
 *             properties:
 *               proposedBy:
 *                 type: string
 *                 description: 제안한 사용자 ID
 *               transaction:
 *                 type: object
 *                 description: XRPL 트랜잭션 데이터
 *               description:
 *                 type: string
 *                 description: 트랜잭션 설명
 *     responses:
 *       '201':
 *         description: 생성된 제안
 */
router.post('/proposals', verifyGroupMembership(), createProposal);

/**
 * @openapi
 * /multisig/proposals/{proposalId}:
 *   get:
 *     summary: 다중 서명 제안 상세 조회
 *     tags:
 *       - Multi-Signature
 *     parameters:
 *       - name: proposalId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 제안 상세 정보
 */
router.get('/proposals/:proposalId', getProposal);

/**
 * @openapi
 * /multisig/proposals/{proposalId}/sign:
 *   post:
 *     summary: 다중 서명 제안에 서명
 *     tags:
 *       - Multi-Signature
 *     parameters:
 *       - name: proposalId
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
 *               - userWalletSeed
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 서명하는 사용자 ID
 *               userWalletSeed:
 *                 type: string
 *                 description: 사용자 지갑 시드
 *     responses:
 *       '200':
 *         description: 서명 결과
 */
router.post('/proposals/:proposalId/sign', signProposal);

/**
 * @openapi
 * /multisig/proposals/{proposalId}/execute:
 *   post:
 *     summary: 다중 서명 트랜잭션 실행
 *     tags:
 *       - Multi-Signature
 *     parameters:
 *       - name: proposalId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 실행 결과
 */
router.post('/proposals/:proposalId/execute', verifyGroupAdmin(), executeProposal);

module.exports = router;