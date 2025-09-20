const express = require('express');
const authController = require('../../controllers/authController');
const { authenticate, loginLimiter } = require('../../middleware/authMiddleware');

const router = express.Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: 사용자 회원가입
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, fullName]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               fullName: { type: string }
 *     responses:
 *       '201':
 *         description: 생성된 사용자 정보
 */
router.post('/register', authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: 사용자 로그인
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       '200':
 *         description: 액세스 및 리프레시 토큰 반환
 */
router.post('/login', loginLimiter, authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: 리프레시 토큰을 이용해 액세스 토큰 재발급
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       '200':
 *         description: 새 토큰 세트
 */
router.post('/refresh', authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: 세션 종료
 *     tags:
 *       - Auth
 *     responses:
 *       '204': { description: 성공 }
 */
router.post('/logout', authController.logout);

/**
 * @openapi
 * /auth/connect-wallet:
 *   post:
 *     summary: XRPL 지갑 주소 연결
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [xrplAddress]
 *             properties:
 *               xrplAddress: { type: string }
 *               publicKey: { type: string }
 *               label: { type: string }
 *     responses:
 *       '200': { description: 연결된 지갑 정보 }
 */
router.post('/connect-wallet', authenticate, authController.connectWallet);

/**
 * @openapi
 * /auth/setup-2fa:
 *   post:
 *     summary: 2FA 시크릿 생성
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200': { description: 생성된 2FA 시크릿 }
 */
router.post('/setup-2fa', authenticate, authController.setup2fa);

/**
 * @openapi
 * /auth/setup-biometric:
 *   post:
 *     summary: 생체인증 메타데이터 등록
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200': { description: 성공 }
 */
router.post('/setup-biometric', authenticate, authController.setupBiometric);

/**
 * @openapi
 * /auth/profile:
 *   get:
 *     summary: 프로필 조회
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200': { description: 사용자 프로필 }
 */
router.get('/profile', authenticate, authController.getProfile);

/**
 * @openapi
 * /auth/change-password:
 *   put:
 *     summary: 비밀번호 변경
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       '204': { description: 성공 }
 */
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
