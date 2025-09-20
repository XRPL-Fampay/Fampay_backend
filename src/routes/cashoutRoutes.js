const express = require("express");
const router = express.Router();
const CashoutController = require("../controllers/cashoutController");
const AuthMiddleware = require("../middleware/authMiddleware");

/**
 * 현금화 관련 라우터
 * Base URL: /api/cashout
 * 개발자 2 담당 - PermissionedDomains 기반 안전 출금
 */

const cashoutController = new CashoutController();
const authMiddleware = new AuthMiddleware();

/**
 * @route   POST /api/cashout/setup-domains
 * @desc    PermissionedDomains 설정
 * @access  Private (admin only)
 * @headers Authorization: Bearer <token>
 * @body    {
 *            adminSeed: string,
 *            allowedDomains: string[]
 *          }
 */
router.post(
  "/setup-domains",
  authMiddleware.authenticateToken(),
  authMiddleware.requireRole(["admin", "owner"]),
  authMiddleware.createRateLimit({ max: 5, windowMs: 24 * 60 * 60 * 1000 }), // 24시간에 5번 제한
  cashoutController.setupPermissionedDomains.bind(cashoutController)
);

/**
 * @route   POST /api/cashout/register-gateway
 * @desc    허가된 게이트웨이 등록
 * @access  Private (admin only)
 * @headers Authorization: Bearer <token>
 * @body    {
 *            gatewayId: string,
 *            name: string,
 *            domain: string,
 *            apiEndpoint: string,
 *            supportedCurrencies: string[],
 *            country: string,
 *            licenseNumber: string,
 *            contactInfo: object
 *          }
 */
router.post(
  "/register-gateway",
  authMiddleware.authenticateToken(),
  authMiddleware.requireRole(["admin", "owner"]),
  authMiddleware.createRateLimit({ max: 20, windowMs: 24 * 60 * 60 * 1000 }), // 24시간에 20번 제한
  cashoutController.registerGateway.bind(cashoutController)
);

/**
 * @route   GET /api/cashout/gateways
 * @desc    허가된 게이트웨이 목록 조회
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get(
  "/gateways",
  authMiddleware.authenticateToken(),
  cashoutController.getApprovedGateways.bind(cashoutController)
);

/**
 * @route   POST /api/cashout/request
 * @desc    현금화 요청 생성
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    {
 *            walletAddress: string,
 *            amount: number,
 *            currency: string,
 *            gatewayId: string,
 *            destinationAccount: string,
 *            memo?: string
 *          }
 */
router.post(
  "/request",
  authMiddleware.authenticateToken(),
  authMiddleware.verifyWalletOwnership(),
  authMiddleware.createRateLimit({ max: 10, windowMs: 60 * 60 * 1000 }), // 1시간에 10번 제한
  cashoutController.createCashoutRequest.bind(cashoutController)
);

/**
 * @route   POST /api/cashout/process/:requestId
 * @desc    현금화 요청 처리
 * @access  Private (admin or owner)
 * @headers Authorization: Bearer <token>
 * @param   requestId - 현금화 요청 ID
 */
router.post(
  "/process/:requestId",
  authMiddleware.authenticateToken(),
  authMiddleware.requireRole(["admin", "owner"]),
  authMiddleware.createRateLimit({ max: 50, windowMs: 60 * 60 * 1000 }), // 1시간에 50번 제한
  cashoutController.processCashoutRequest.bind(cashoutController)
);

/**
 * @route   GET /api/cashout/status/:requestId
 * @desc    현금화 요청 상태 조회
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @param   requestId - 현금화 요청 ID
 */
router.get(
  "/status/:requestId",
  authMiddleware.authenticateToken(),
  cashoutController.getCashoutRequestStatus.bind(cashoutController)
);

/**
 * @route   POST /api/cashout/receipt/:requestId
 * @desc    현금화 영수증 생성
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @param   requestId - 현금화 요청 ID
 */
router.post(
  "/receipt/:requestId",
  authMiddleware.authenticateToken(),
  authMiddleware.createRateLimit({ max: 20, windowMs: 60 * 60 * 1000 }), // 1시간에 20번 제한
  cashoutController.generateCashoutReceipt.bind(cashoutController)
);

/**
 * @route   GET /api/cashout/receipt/:receiptId
 * @desc    영수증 조회
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @param   receiptId - 영수증 ID
 */
router.get(
  "/receipt/:receiptId",
  authMiddleware.authenticateToken(),
  cashoutController.getReceipt.bind(cashoutController)
);

/**
 * @route   POST /api/cashout/bank-transfer
 * @desc    은행 이체 처리
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    {
 *            requestId: string,
 *            bankCode: string,
 *            accountNumber: string,
 *            accountHolderName: string,
 *            amount: number,
 *            currency: string,
 *            memo?: string
 *          }
 */
router.post(
  "/bank-transfer",
  authMiddleware.authenticateToken(),
  authMiddleware.createRateLimit({ max: 20, windowMs: 60 * 60 * 1000 }), // 1시간에 20번 제한
  cashoutController.processBankTransfer.bind(cashoutController)
);

/**
 * @route   POST /api/cashout/mobile-money
 * @desc    모바일머니 이체 처리
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    {
 *            requestId: string,
 *            provider: string,
 *            phoneNumber: string,
 *            amount: number,
 *            currency: string,
 *            memo?: string
 *          }
 */
router.post(
  "/mobile-money",
  authMiddleware.authenticateToken(),
  authMiddleware.createRateLimit({ max: 20, windowMs: 60 * 60 * 1000 }), // 1시간에 20번 제한
  cashoutController.processMobileMoneyTransfer.bind(cashoutController)
);

module.exports = router;
