const express = require('express');
const cashoutController = require('../../controllers/cashoutController');
const { authenticate, requireRole } = require('../../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * /cashout/setup-domains:
 *   post:
 *     summary: PermissionedDomains 설정
 *     tags:
 *       - Cashout
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '201': { description: 허용 도메인 등록 }
 */
router.post('/setup-domains', requireRole('ADMIN'), cashoutController.setupDomain);

/**
 * @openapi
 * /cashout/domains:
 *   get:
 *     summary: 허용된 도메인 목록
 *     tags:
 *       - Cashout
 *     security:
 *       - bearerAuth: []
 */
router.get('/domains', cashoutController.listDomains);

/**
 * @openapi
 * /cashout/domains/{domainId}/verify:
 *   patch:
 *     summary: 도메인 검증 상태 업데이트
 *     tags:
 *       - Cashout
 *     security:
 *       - bearerAuth: []
 */
router.patch('/domains/:domainId/verify', requireRole('ADMIN'), cashoutController.verifyDomain);

/**
 * @openapi
 * /cashout/domains/{domainId}:
 *   delete:
 *     summary: 허용 도메인 삭제
 *     tags:
 *       - Cashout
 *     security:
 *       - bearerAuth: []
 */
router.delete('/domains/:domainId', requireRole('ADMIN'), cashoutController.removeDomain);

/**
 * @openapi
 * /cashout/register-gateway:
 *   post:
 *     summary: 현금화 게이트웨이 등록
 *     tags:
 *       - Cashout
 *     security:
 *       - bearerAuth: []
 */
router.post('/register-gateway', requireRole('ADMIN'), cashoutController.registerGateway);

/**
 * @openapi
 * /cashout/gateways:
 *   get:
 *     summary: 게이트웨이 목록 조회
 *     tags:
 *       - Cashout
 *     security:
 *       - bearerAuth: []
 */
router.get('/gateways', cashoutController.listGateways);

/**
 * @openapi
 * /cashout/request:
 *   post:
 *     summary: 현금화 요청 생성
 *     tags:
 *       - Cashout
 *     security:
 *       - bearerAuth: []
 */
router.post('/request', cashoutController.requestCashout);

/**
 * @openapi
 * /cashout/process/{requestId}:
 *   post:
 *     summary: 현금화 요청 승인/거절
 *     tags:
 *       - Cashout
 *     security:
 *       - bearerAuth: []
 */
router.post('/process/:requestId', requireRole('ADMIN'), cashoutController.processRequest);

/**
 * @openapi
 * /cashout/status/{requestId}:
 *   get:
 *     summary: 현금화 요청 상태 확인
 *     tags:
 *       - Cashout
 *     security:
 *       - bearerAuth: []
 */
router.get('/status/:requestId', cashoutController.getStatus);

/**
 * @openapi
 * /cashout/receipt/{receiptId}:
 *   get:
 *     summary: 영수증 조회
 *     tags:
 *       - Cashout
 *     security:
 *       - bearerAuth: []
 */
router.get('/receipt/:receiptId', cashoutController.getReceipt);

/**
 * @openapi
 * /cashout/receipt/{requestId}:
 *   post:
 *     summary: 영수증 발행
 *     tags:
 *       - Cashout
 *     security:
 *       - bearerAuth: []
 */
router.post('/receipt/:requestId', requireRole('ADMIN'), cashoutController.createReceipt);

/**
 * @openapi
 * /cashout/bank-transfer/{requestId}:
 *   post:
 *     summary: 은행 이체 처리
 *     tags:
 *       - Cashout
 *     security:
 *       - bearerAuth: []
 */
router.post('/bank-transfer/:requestId', requireRole('ADMIN'), cashoutController.bankTransfer);

/**
 * @openapi
 * /cashout/mobile-money/{requestId}:
 *   post:
 *     summary: 모바일머니 이체 처리
 *     tags:
 *       - Cashout
 *     security:
 *       - bearerAuth: []
 */
router.post('/mobile-money/:requestId', requireRole('ADMIN'), cashoutController.mobileMoney);

module.exports = router;
