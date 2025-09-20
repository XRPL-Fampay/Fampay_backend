const express = require("express");
const router = express.Router();
const KeyController = require("../controllers/keyController");
const AuthMiddleware = require("../middleware/authMiddleware");

/**
 * 키 관리 관련 라우터
 * Base URL: /api/keys
 * 개발자 2 담당 - 보안 중심 구현
 */

const keyController = new KeyController();
const authMiddleware = new AuthMiddleware();

/**
 * @route   POST /api/keys/create-wallet
 * @desc    새 지갑 생성 (니모닉 포함)
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    {
 *            strength?: number (128|256),
 *            password?: string
 *          }
 */
router.post(
  "/create-wallet",
  authMiddleware.authenticateToken(),
  authMiddleware.createRateLimit({ max: 10, windowMs: 60 * 60 * 1000 }), // 1시간에 10개 지갑 생성 제한
  keyController.createWallet.bind(keyController)
);

/**
 * @route   POST /api/keys/recover-wallet
 * @desc    니모닉에서 지갑 복구
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    {
 *            mnemonic: string,
 *            password?: string
 *          }
 */
router.post(
  "/recover-wallet",
  authMiddleware.authenticateToken(),
  authMiddleware.createRateLimit({ max: 20, windowMs: 60 * 60 * 1000 }), // 1시간에 20번 복구 시도 제한
  keyController.recoverWallet.bind(keyController)
);

/**
 * @route   POST /api/keys/setup-multisig
 * @desc    멀티시그 지갑 설정 (2/3 승인)
 * @access  Private (admin or owner role required)
 * @headers Authorization: Bearer <token>
 * @body    {
 *            signers: string[], // 3개의 서명자 주소
 *            masterSeed: string
 *          }
 */
router.post(
  "/setup-multisig",
  authMiddleware.authenticateToken(),
  authMiddleware.requireRole(["admin", "owner"]), // 관리자 또는 소유자만 가능
  authMiddleware.createRateLimit({ max: 5, windowMs: 24 * 60 * 60 * 1000 }), // 24시간에 5번 제한
  keyController.setupMultiSig.bind(keyController)
);

/**
 * @route   POST /api/keys/setup-social-recovery
 * @desc    소셜 리커버리 설정
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    {
 *            walletAddress: string,
 *            guardians: string[], // 가디언 주소 배열
 *            threshold?: number
 *          }
 */
router.post(
  "/setup-social-recovery",
  authMiddleware.authenticateToken(),
  authMiddleware.verifyWalletOwnership(), // 지갑 소유권 검증
  authMiddleware.createRateLimit({ max: 10, windowMs: 24 * 60 * 60 * 1000 }), // 24시간에 10번 제한
  keyController.setupSocialRecovery.bind(keyController)
);

/**
 * @route   POST /api/keys/execute-social-recovery
 * @desc    소셜 리커버리 실행
 * @access  Public (가디언들이 실행할 수 있어야 함)
 * @body    {
 *            recoveryId: string,
 *            guardianSignatures: string[],
 *            newMnemonic: string
 *          }
 */
router.post(
  "/execute-social-recovery",
  authMiddleware.createRateLimit({ max: 5, windowMs: 60 * 60 * 1000 }), // 1시간에 5번 제한
  keyController.executeSocialRecovery.bind(keyController)
);

/**
 * @route   POST /api/keys/setup-hybrid-custody
 * @desc    하이브리드 커스터디 설정
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    {
 *            walletSeed: string,
 *            options?: {
 *              enableSelfCustody?: boolean,
 *              enableSharedCustody?: boolean,
 *              enableFullCustody?: boolean,
 *              custodyThreshold?: number
 *            }
 *          }
 */
router.post(
  "/setup-hybrid-custody",
  authMiddleware.authenticateToken(),
  authMiddleware.createRateLimit({ max: 5, windowMs: 24 * 60 * 60 * 1000 }), // 24시간에 5번 제한
  keyController.setupHybridCustody.bind(keyController)
);

/**
 * @route   POST /api/keys/create-backup
 * @desc    지갑 백업 생성
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    {
 *            mnemonic: string,
 *            password: string
 *          }
 */
router.post(
  "/create-backup",
  authMiddleware.authenticateToken(),
  authMiddleware.createRateLimit({ max: 20, windowMs: 24 * 60 * 60 * 1000 }), // 24시간에 20개 백업 제한
  keyController.createBackup.bind(keyController)
);

/**
 * @route   POST /api/keys/restore-from-backup
 * @desc    백업에서 지갑 복원
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    {
 *            backupId: string,
 *            password: string
 *          }
 */
router.post(
  "/restore-from-backup",
  authMiddleware.authenticateToken(),
  authMiddleware.createRateLimit({ max: 10, windowMs: 60 * 60 * 1000 }), // 1시간에 10번 복원 제한
  keyController.restoreFromBackup.bind(keyController)
);

/**
 * @route   GET /api/keys/backups
 * @desc    사용자의 백업 목록 조회
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get(
  "/backups",
  authMiddleware.authenticateToken(),
  keyController.getBackups.bind(keyController)
);

module.exports = router;
