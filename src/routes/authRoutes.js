const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");
const AuthMiddleware = require("../middleware/authMiddleware");

/**
 * 인증 관련 라우터
 * Base URL: /api/auth
 * 개발자 2 담당 - 보안 중심 구현
 */

const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

/**
 * @route   POST /api/auth/register
 * @desc    사용자 회원가입
 * @access  Public
 * @body    {
 *            email: string,
 *            password: string,
 *            confirmPassword: string,
 *            walletAddress: string,
 *            familyRole?: string
 *          }
 */
router.post(
  "/register",
  authMiddleware.loginRateLimit(), // 등록 시도 제한
  authController.register.bind(authController)
);

/**
 * @route   POST /api/auth/login
 * @desc    사용자 로그인
 * @access  Public
 * @body    {
 *            email: string,
 *            password: string
 *          }
 */
router.post(
  "/login",
  authMiddleware.loginRateLimit(), // 로그인 시도 제한
  authController.login.bind(authController)
);

/**
 * @route   POST /api/auth/refresh
 * @desc    토큰 갱신
 * @access  Public
 * @body    {
 *            refreshToken: string
 *          }
 */
router.post(
  "/refresh",
  authMiddleware.createRateLimit({ max: 50, windowMs: 15 * 60 * 1000 }), // 토큰 갱신 제한
  authController.refreshToken.bind(authController)
);

/**
 * @route   POST /api/auth/logout
 * @desc    사용자 로그아웃
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.post(
  "/logout",
  authMiddleware.authenticateToken(),
  authController.logout.bind(authController)
);

/**
 * @route   POST /api/auth/connect-wallet
 * @desc    지갑 연결
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    {
 *            walletAddress: string,
 *            signature: string,
 *            message: string
 *          }
 */
router.post(
  "/connect-wallet",
  authMiddleware.authenticateToken(),
  authController.connectWallet.bind(authController)
);

/**
 * @route   POST /api/auth/setup-2fa
 * @desc    2FA 설정
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    {
 *            method?: string (sms|email|app)
 *          }
 */
router.post(
  "/setup-2fa",
  authMiddleware.authenticateToken(),
  authController.setup2FA.bind(authController)
);

/**
 * @route   POST /api/auth/setup-biometric
 * @desc    생체인증 설정
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    {
 *            biometricType: string (fingerprint|face|voice)
 *          }
 */
router.post(
  "/setup-biometric",
  authMiddleware.authenticateToken(),
  authController.setupBiometric.bind(authController)
);

/**
 * @route   GET /api/auth/profile
 * @desc    사용자 프로필 조회
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get(
  "/profile",
  authMiddleware.authenticateToken(),
  authController.getProfile.bind(authController)
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    비밀번호 변경
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    {
 *            currentPassword: string,
 *            newPassword: string,
 *            confirmNewPassword: string
 *          }
 */
router.put(
  "/change-password",
  authMiddleware.authenticateToken(),
  authMiddleware.createRateLimit({ max: 5, windowMs: 60 * 60 * 1000 }), // 비밀번호 변경 제한 (1시간에 5번)
  authController.changePassword.bind(authController)
);

module.exports = router;
