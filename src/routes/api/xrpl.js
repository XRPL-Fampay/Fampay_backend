const express = require('express');
const xrplController = require('../../controllers/xrplController');
const { authenticate } = require('../../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * /xrpl/payment:
 *   post:
 *     summary: XRPL Payment 실행 (XRP/IOU)
 *     tags:
 *       - XRPL
 *     security:
 *       - bearerAuth: []
 */
router.post('/payment', xrplController.sendPayment);

/**
 * @openapi
 * /xrpl/batch:
 *   post:
 *     summary: XRPL Batch Payment 실행
 *     tags:
 *       - XRPL
 *     security:
 *       - bearerAuth: []
 */
router.post('/batch', xrplController.sendBatch);

/**
 * @openapi
 * /xrpl/escrow/create:
 *   post:
 *     summary: Escrow 생성
 *     tags:
 *       - XRPL
 *     security:
 *       - bearerAuth: []
 */
router.post('/escrow/create', xrplController.escrowCreate);

/**
 * @openapi
 * /xrpl/escrow/finish:
 *   post:
 *     summary: Escrow 완료
 *     tags:
 *       - XRPL
 *     security:
 *       - bearerAuth: []
 */
router.post('/escrow/finish', xrplController.escrowFinish);

/**
 * @openapi
 * /xrpl/escrow/cancel:
 *   post:
 *     summary: Escrow 취소
 *     tags:
 *       - XRPL
 *     security:
 *       - bearerAuth: []
 */
router.post('/escrow/cancel', xrplController.escrowCancel);

module.exports = router;
