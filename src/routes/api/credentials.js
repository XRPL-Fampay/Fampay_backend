const express = require('express');
const {
  createCredential,
  checkCredential,
  createGroupCredentials,
  verifyGroupAccess
} = require('../../controllers/credentialController');

const router = express.Router({ mergeParams: true });

/**
 * @openapi
 * /groups/{groupId}/credentials:
 *   post:
 *     summary: 그룹 멤버에게 credential 발급
 *     tags:
 *       - Credentials
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
 *               - subjectAddress
 *             properties:
 *               subjectAddress:
 *                 type: string
 *                 description: 멤버의 XRPL 주소
 *               credentialType:
 *                 type: string
 *                 default: "GROUP_MEMBER"
 *               expirationHours:
 *                 type: number
 *                 default: 8760
 *     responses:
 *       '201':
 *         description: Credential 발급 성공
 */
router.post('/', createCredential);

/**
 * @openapi
 * /groups/{groupId}/credentials/check:
 *   get:
 *     summary: 멤버의 credential 확인
 *     tags:
 *       - Credentials
 *     parameters:
 *       - name: groupId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: subjectAddress
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: credentialType
 *         in: query
 *         schema:
 *           type: string
 *           default: "GROUP_MEMBER"
 *     responses:
 *       '200':
 *         description: Credential 확인 결과
 */
router.get('/check', checkCredential);

/**
 * @openapi
 * /groups/{groupId}/credentials/batch:
 *   post:
 *     summary: 여러 멤버에게 credential 일괄 발급
 *     tags:
 *       - Credentials
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
 *               - memberAddresses
 *             properties:
 *               memberAddresses:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       '201':
 *         description: 일괄 credential 발급 결과
 */
router.post('/batch', createGroupCredentials);

/**
 * @openapi
 * /groups/{groupId}/credentials/verify:
 *   get:
 *     summary: 그룹 접근 권한 확인
 *     tags:
 *       - Credentials
 *     parameters:
 *       - name: groupId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: userAddress
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 접근 권한 확인 결과
 */
router.get('/verify', verifyGroupAccess);

module.exports = router;