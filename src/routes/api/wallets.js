const express = require('express');
const {
  generateWallet,
  faucetWallet,
  getWalletInfo,
  validateWallet
} = require('../../controllers/walletController');

const router = express.Router();

/**
 * @openapi
 * /wallets/generate:
 *   post:
 *     summary: XRPL 지갑 생성
 *     tags:
 *       - Wallets
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fund:
 *                 type: boolean
 *                 description: 테스트넷 faucet으로 자동 펀딩 여부
 *                 default: false
 *     responses:
 *       '201':
 *         description: 생성된 지갑 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wallet:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: string
 *                     publicKey:
 *                       type: string
 *                     seed:
 *                       type: string
 *                 funded:
 *                   type: boolean
 *                 network:
 *                   type: object
 *                   properties:
 *                     network:
 *                       type: string
 *                     endpoint:
 *                       type: string
 *             example:
 *               wallet:
 *                 address: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe'
 *                 publicKey: '03AB...'
 *                 seed: 's████████'
 *               funded: false
 *               network:
 *                 network: 'testnet'
 *                 endpoint: 'wss://s.altnet.rippletest.net:51233'
 */
router.post('/generate', generateWallet);

/**
 * @openapi
 * /wallets/faucet:
 *   post:
 *     summary: 기존 지갑 faucet 펀딩
 *     tags:
 *       - Wallets
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seed:
 *                 type: string
 *               address:
 *                 type: string
 *             oneOf:
 *               - required: [seed]
 *               - required: [address]
 *     responses:
 *       '200':
 *         description: 펀딩 결과와 잔액
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wallet:
 *                   type: object
 *                 funded:
 *                   type: boolean
 *                 funding:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: number
 *                     amount:
 *                       type: string
 *                     transactionHash:
 *                       type: string
 *             example:
 *               wallet:
 *                 address: 'rPT1...'
 *               funded: true
 *               funding:
 *                 balance: 1000
 *                 amount: '1000000'
 *                 transactionHash: 'ABC123'
 */
router.post('/faucet', faucetWallet);

/**
 * @openapi
 * /wallets/{address}:
 *   get:
 *     summary: XRPL 지갑 정보 조회
 *     tags:
 *       - Wallets
 *     parameters:
 *       - name: address
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 지갑 잔액, account info, trust line 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 address:
 *                   type: string
 *                 balance:
 *                   type: string
 *                 account:
 *                   type: object
 *                 trustLines:
 *                   type: array
 *                   items:
 *                     type: object
 *             example:
 *               address: 'rPT1...'
 *               balance: '1000'
 *               account:
 *                 Sequence: 10
 *               trustLines: []
 */
router.get('/:address', getWalletInfo);

/**
 * @openapi
 * /wallets/validate:
 *   post:
 *     summary: XRPL 주소 유효성 검사
 *     tags:
 *       - Wallets
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *     responses:
 *       '200':
 *         description: 유효성 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 address:
 *                   type: string
 *                 isValid:
 *                   type: boolean
 */
router.post('/validate', validateWallet);

module.exports = router;
