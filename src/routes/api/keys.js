const express = require('express');
const keyController = require('../../controllers/keyController');
const { authenticate } = require('../../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * /keys/create-wallet:
 *   post:
 *     summary: 새 XRPL 지갑 생성 및 니모닉 반환
 *     tags:
 *       - Key Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '201': { description: 니모닉 및 지갑 정보 }
 */
router.post('/create-wallet', keyController.createWallet);

/**
 * @openapi
 * /keys/recover-wallet:
 *   post:
 *     summary: 니모닉으로 지갑 복구
 *     tags:
 *       - Key Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200': { description: 지갑 정보 }
 */
router.post('/recover-wallet', keyController.recoverWallet);

/**
 * @openapi
 * /keys/setup-multisig:
 *   post:
 *     summary: 멀티시그 설정
 *     tags:
 *       - Key Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200': { description: 설정된 멀티시그 정보 }
 */
router.post('/setup-multisig', keyController.setupMultisig);

/**
 * @openapi
 * /keys/setup-social-recovery:
 *   post:
 *     summary: 소셜 리커버리 설정
 *     tags:
 *       - Key Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200': { description: 설정 정보 }
 */
router.post('/setup-social-recovery', keyController.setupSocialRecovery);

/**
 * @openapi
 * /keys/execute-social-recovery:
 *   post:
 *     summary: 소셜 리커버리 실행
 *     tags:
 *       - Key Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200': { description: 복구된 지갑 정보 }
 */
router.post('/execute-social-recovery', keyController.executeSocialRecovery);

/**
 * @openapi
 * /keys/setup-hybrid-custody:
 *   post:
 *     summary: 하이브리드 커스터디 설정
 *     tags:
 *       - Key Management
 *     security:
 *       - bearerAuth: []
 */
router.post('/setup-hybrid-custody', keyController.setupHybridCustody);

/**
 * @openapi
 * /keys/create-backup:
 *   post:
 *     summary: 지갑 백업 생성
 *     tags:
 *       - Key Management
 *     security:
 *       - bearerAuth: []
 */
router.post('/create-backup', keyController.createBackup);

/**
 * @openapi
 * /keys/backups:
 *   get:
 *     summary: 백업 목록 조회
 *     tags:
 *       - Key Management
 *     security:
 *       - bearerAuth: []
 */
router.get('/backups', keyController.listBackups);

/**
 * @openapi
 * /keys/restore-from-backup:
 *   post:
 *     summary: 백업 복원
 *     tags:
 *       - Key Management
 *     security:
 *       - bearerAuth: []
 */
router.post('/restore-from-backup', keyController.restoreFromBackup);

module.exports = router;
