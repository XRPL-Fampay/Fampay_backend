const express = require('express');
const {
  createDomain,
  listDomains,
  verifyDomain,
  deleteDomain
} = require('../../controllers/permissionedDomainController');

const router = express.Router({ mergeParams: true });

/**
 * @openapi
 * /groups/{groupId}/permissioned-domains:
 *   get:
 *     summary: 그룹 허가 게이트웨이 도메인 목록
 *     tags:
 *       - Permissioned Domains
 *     parameters:
 *       - name: groupId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 도메인 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PermissionedDomain'
 */
router.get('/', listDomains);

/**
 * @openapi
 * /groups/{groupId}/permissioned-domains:
 *   post:
 *     summary: 허가 도메인 등록
 *     tags:
 *       - Permissioned Domains
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
 *               - domain
 *             properties:
 *               domain:
 *                 type: string
 *               label:
 *                 type: string
 *               createdById:
 *                 type: string
 *     responses:
 *       '201':
 *         description: 생성된 도메인 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PermissionedDomain'
 */
router.post('/', createDomain);

/**
 * @openapi
 * /groups/{groupId}/permissioned-domains/{domainId}/verify:
 *   patch:
 *     summary: 허가 도메인 검증 상태 업데이트
 *     tags:
 *       - Permissioned Domains
 *     parameters:
 *       - name: groupId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: domainId
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
 *               verified:
 *                 type: boolean
 *     responses:
 *       '200':
 *         description: 업데이트된 도메인
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PermissionedDomain'
 */
router.patch('/:domainId/verify', verifyDomain);

/**
 * @openapi
 * /groups/{groupId}/permissioned-domains/{domainId}:
 *   delete:
 *     summary: 허가 도메인 삭제
 *     tags:
 *       - Permissioned Domains
 *     parameters:
 *       - name: groupId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: domainId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 삭제 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */
router.delete('/:domainId', deleteDomain);

module.exports = router;
