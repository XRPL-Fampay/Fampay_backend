const express = require('express');
const trustSetController = require('../../controllers/trustSetController');

const router = express.Router();

/**
 * @openapi
 * /trustset/setup:
 *   post:
 *     summary: TrustLine 설정 (사용자 측)
 *     tags:
 *       - TrustSet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [seed, currency, issuer, limit]
 *             properties:
 *               seed: { type: string }
 *               currency: { type: string }
 *               issuer: { type: string }
 *               limit: { type: string }
 *               memo: { type: string }
 *     responses:
 *       '201': { description: TrustLine 설정 결과 }
 */
router.post('/setup', trustSetController.setupTrustLine);

/**
 * @openapi
 * /trustset/authorize:
 *   post:
 *     summary: 발행자 측에서 TrustLine 승인
 *     tags:
 *       - TrustSet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [seed, currency, counterparty]
 *             properties:
 *               seed: { type: string }
 *               currency: { type: string }
 *               counterparty: { type: string }
 *               memo: { type: string }
 *     responses:
 *       '200': { description: 승인 결과 }
 */
router.post('/authorize', trustSetController.authorizeTrustLine);

module.exports = router;
