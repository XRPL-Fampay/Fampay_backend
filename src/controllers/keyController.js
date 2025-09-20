const KeyManagementService = require("../services/keyManagementService");
const AuthService = require("../services/authService");

/**
 * 키 관리 관련 API 컨트롤러
 * 개발자 2 담당 - 보안 중심 구현
 */
class KeyController {
  constructor() {
    this.keyManagementService = new KeyManagementService();
    this.authService = new AuthService();
    // 실제 구현에서는 데이터베이스 연결 필요
    this.walletBackups = new Map(); // 임시 백업 저장소
    this.recoveryConfigs = new Map(); // 임시 복구 설정 저장소
  }

  /**
   * 새 지갑 생성 (니모닉 포함) API
   * POST /api/keys/create-wallet
   */
  async createWallet(req, res) {
    try {
      const { strength, password } = req.body;
      const userId = req.user?.userId;

      // 니모닉 강도 검증 (기본값: 128비트 = 12단어)
      const mnemonicStrength = strength === 256 ? 256 : 128;

      // 새 지갑 생성
      const walletData =
        this.keyManagementService.generateMnemonic(mnemonicStrength);

      // 니모닉 암호화 (비밀번호가 제공된 경우)
      let encryptedMnemonic = null;
      if (password) {
        encryptedMnemonic = this.keyManagementService.encryptMnemonic(
          walletData.mnemonic,
          password
        );
      }

      // 백업 생성 및 저장
      if (password) {
        const backup = this.keyManagementService.createWalletBackup(
          walletData.mnemonic,
          password
        );
        this.walletBackups.set(backup.backupId, backup);
      }

      // 보안 이벤트 로깅
      if (userId) {
        this.authService.logSecurityEvent(userId, "wallet_created", {
          walletAddress: walletData.wallet.address,
          strength: mnemonicStrength,
          wordCount: walletData.wordCount,
          encrypted: !!password,
        });
      }

      res.status(201).json({
        success: true,
        message: "Wallet created successfully",
        data: {
          wallet: {
            address: walletData.wallet.address,
            publicKey: walletData.wallet.publicKey,
            // privateKey와 seed는 보안상 반환하지 않음
          },
          mnemonic: password ? undefined : walletData.mnemonic, // 암호화된 경우 반환 안함
          encryptedMnemonic: encryptedMnemonic,
          strength: walletData.strength,
          wordCount: walletData.wordCount,
          backupId: password
            ? Array.from(this.walletBackups.keys()).pop()
            : undefined,
        },
      });
    } catch (error) {
      console.error("❌ Wallet creation failed:", error);
      res.status(500).json({
        success: false,
        message: "Wallet creation failed",
        code: "WALLET_CREATION_ERROR",
      });
    }
  }

  /**
   * 니모닉에서 지갑 복구 API
   * POST /api/keys/recover-wallet
   */
  async recoverWallet(req, res) {
    try {
      const { mnemonic, password } = req.body;
      const userId = req.user?.userId;

      if (!mnemonic) {
        return res.status(400).json({
          success: false,
          message: "Mnemonic phrase is required",
          code: "MNEMONIC_REQUIRED",
        });
      }

      let actualMnemonic = mnemonic;

      // 암호화된 니모닉인 경우 복호화
      if (password) {
        try {
          actualMnemonic = this.keyManagementService.decryptMnemonic(
            mnemonic,
            password
          );
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: "Failed to decrypt mnemonic. Check your password.",
            code: "DECRYPTION_FAILED",
          });
        }
      }

      // 지갑 복구
      const recoveryResult =
        this.keyManagementService.recoverFromMnemonic(actualMnemonic);

      // 보안 이벤트 로깅
      if (userId) {
        this.authService.logSecurityEvent(userId, "wallet_recovered", {
          walletAddress: recoveryResult.wallet.address,
          encrypted: !!password,
        });
      }

      res.status(200).json({
        success: true,
        message: "Wallet recovered successfully",
        data: {
          wallet: {
            address: recoveryResult.wallet.address,
            publicKey: recoveryResult.wallet.publicKey,
            // privateKey와 seed는 보안상 반환하지 않음
          },
          recovered: recoveryResult.recovered,
          recoveredAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("❌ Wallet recovery failed:", error);

      // 보안 이벤트 로깅
      if (req.user?.userId) {
        this.authService.logSecurityEvent(
          req.user.userId,
          "wallet_recovery_failed",
          {
            error: error.message,
          }
        );
      }

      res.status(400).json({
        success: false,
        message: error.message || "Wallet recovery failed",
        code: "WALLET_RECOVERY_ERROR",
      });
    }
  }

  /**
   * 멀티시그 지갑 설정 API
   * POST /api/keys/setup-multisig
   */
  async setupMultiSig(req, res) {
    try {
      const { signers, masterSeed } = req.body;
      const userId = req.user?.userId;

      if (!signers || !Array.isArray(signers) || signers.length !== 3) {
        return res.status(400).json({
          success: false,
          message: "Exactly 3 signer addresses are required",
          code: "INVALID_SIGNERS",
        });
      }

      if (!masterSeed) {
        return res.status(400).json({
          success: false,
          message: "Master wallet seed is required",
          code: "MASTER_SEED_REQUIRED",
        });
      }

      // 멀티시그 설정
      const multiSigResult = await this.keyManagementService.setupMultiSig(
        signers,
        masterSeed
      );

      // 보안 이벤트 로깅
      if (userId) {
        this.authService.logSecurityEvent(userId, "multisig_setup", {
          masterAccount: multiSigResult.account,
          signersCount: signers.length,
          quorum: multiSigResult.quorum,
          transactionHash: multiSigResult.hash,
        });
      }

      res.status(200).json({
        success: true,
        message: "MultiSig wallet setup completed",
        data: {
          account: multiSigResult.account,
          signers: multiSigResult.signers,
          quorum: multiSigResult.quorum,
          transactionHash: multiSigResult.hash,
          setupAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("❌ MultiSig setup failed:", error);
      res.status(500).json({
        success: false,
        message: "MultiSig setup failed",
        code: "MULTISIG_SETUP_ERROR",
      });
    }
  }

  /**
   * 소셜 리커버리 설정 API
   * POST /api/keys/setup-social-recovery
   */
  async setupSocialRecovery(req, res) {
    try {
      const { walletAddress, guardians, threshold } = req.body;
      const userId = req.user?.userId;

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          message: "Wallet address is required",
          code: "WALLET_ADDRESS_REQUIRED",
        });
      }

      if (!guardians || !Array.isArray(guardians) || guardians.length < 2) {
        return res.status(400).json({
          success: false,
          message: "At least 2 guardian addresses are required",
          code: "INSUFFICIENT_GUARDIANS",
        });
      }

      const recoveryThreshold = threshold || Math.ceil(guardians.length / 2);

      // 소셜 리커버리 설정
      const recoveryConfig = this.keyManagementService.setupSocialRecovery(
        walletAddress,
        guardians,
        recoveryThreshold
      );

      // 설정 저장 (실제로는 DB에 저장)
      this.recoveryConfigs.set(recoveryConfig.recoveryId, recoveryConfig);

      // 보안 이벤트 로깅
      if (userId) {
        this.authService.logSecurityEvent(userId, "social_recovery_setup", {
          walletAddress,
          guardiansCount: guardians.length,
          threshold: recoveryThreshold,
          recoveryId: recoveryConfig.recoveryId,
        });
      }

      res.status(200).json({
        success: true,
        message: "Social recovery setup completed",
        data: {
          recoveryId: recoveryConfig.recoveryId,
          walletAddress: recoveryConfig.userAddress,
          guardians: recoveryConfig.guardians,
          threshold: recoveryConfig.threshold,
          createdAt: recoveryConfig.createdAt,
        },
      });
    } catch (error) {
      console.error("❌ Social recovery setup failed:", error);
      res.status(500).json({
        success: false,
        message: "Social recovery setup failed",
        code: "SOCIAL_RECOVERY_SETUP_ERROR",
      });
    }
  }

  /**
   * 소셜 리커버리 실행 API
   * POST /api/keys/execute-social-recovery
   */
  async executeSocialRecovery(req, res) {
    try {
      const { recoveryId, guardianSignatures, newMnemonic } = req.body;
      const userId = req.user?.userId;

      if (!recoveryId || !guardianSignatures || !newMnemonic) {
        return res.status(400).json({
          success: false,
          message:
            "Recovery ID, guardian signatures, and new mnemonic are required",
          code: "MISSING_RECOVERY_DATA",
        });
      }

      // 복구 설정 조회
      const recoveryConfig = this.recoveryConfigs.get(recoveryId);
      if (!recoveryConfig) {
        return res.status(404).json({
          success: false,
          message: "Recovery configuration not found",
          code: "RECOVERY_CONFIG_NOT_FOUND",
        });
      }

      // 소셜 리커버리 실행
      const recoveryResult = this.keyManagementService.executeSocialRecovery(
        recoveryId,
        guardianSignatures,
        newMnemonic
      );

      // 복구 설정 제거 (일회성)
      this.recoveryConfigs.delete(recoveryId);

      // 보안 이벤트 로깅
      if (userId) {
        this.authService.logSecurityEvent(userId, "social_recovery_executed", {
          recoveryId,
          oldWalletAddress: recoveryConfig.userAddress,
          newWalletAddress: recoveryResult.newWallet.address,
          guardiansUsed: guardianSignatures.length,
        });
      }

      res.status(200).json({
        success: true,
        message: "Social recovery executed successfully",
        data: {
          recoveryId: recoveryResult.recoveryId,
          newWallet: {
            address: recoveryResult.newWallet.address,
            publicKey: recoveryResult.newWallet.publicKey,
          },
          recoveredAt: recoveryResult.recoveredAt,
        },
      });
    } catch (error) {
      console.error("❌ Social recovery execution failed:", error);
      res.status(500).json({
        success: false,
        message: "Social recovery execution failed",
        code: "SOCIAL_RECOVERY_EXECUTION_ERROR",
      });
    }
  }

  /**
   * 하이브리드 커스터디 설정 API
   * POST /api/keys/setup-hybrid-custody
   */
  async setupHybridCustody(req, res) {
    try {
      const { walletSeed, options } = req.body;
      const userId = req.user?.userId;

      if (!walletSeed) {
        return res.status(400).json({
          success: false,
          message: "Wallet seed is required",
          code: "WALLET_SEED_REQUIRED",
        });
      }

      // 하이브리드 커스터디 설정
      const custodyConfig = this.keyManagementService.setupHybridCustody(
        walletSeed,
        options
      );

      // 보안 이벤트 로깅
      if (userId) {
        this.authService.logSecurityEvent(userId, "hybrid_custody_setup", {
          walletAddress: custodyConfig.userAddress,
          custodyId: custodyConfig.custodyId,
          selfCustody: custodyConfig.selfCustody,
          sharedCustody: custodyConfig.sharedCustody,
          fullCustody: custodyConfig.fullCustody,
        });
      }

      res.status(200).json({
        success: true,
        message: "Hybrid custody setup completed",
        data: {
          custodyId: custodyConfig.custodyId,
          walletAddress: custodyConfig.userAddress,
          selfCustody: custodyConfig.selfCustody,
          sharedCustody: custodyConfig.sharedCustody,
          fullCustody: custodyConfig.fullCustody,
          threshold: custodyConfig.threshold,
          createdAt: custodyConfig.createdAt,
        },
      });
    } catch (error) {
      console.error("❌ Hybrid custody setup failed:", error);
      res.status(500).json({
        success: false,
        message: "Hybrid custody setup failed",
        code: "HYBRID_CUSTODY_SETUP_ERROR",
      });
    }
  }

  /**
   * 지갑 백업 생성 API
   * POST /api/keys/create-backup
   */
  async createBackup(req, res) {
    try {
      const { mnemonic, password } = req.body;
      const userId = req.user?.userId;

      if (!mnemonic || !password) {
        return res.status(400).json({
          success: false,
          message: "Mnemonic and password are required",
          code: "MNEMONIC_PASSWORD_REQUIRED",
        });
      }

      // 백업 생성
      const backup = this.keyManagementService.createWalletBackup(
        mnemonic,
        password
      );

      // 백업 저장 (실제로는 DB에 저장)
      this.walletBackups.set(backup.backupId, backup);

      // 보안 이벤트 로깅
      if (userId) {
        this.authService.logSecurityEvent(userId, "wallet_backup_created", {
          walletAddress: backup.address,
          backupId: backup.backupId,
        });
      }

      res.status(201).json({
        success: true,
        message: "Wallet backup created successfully",
        data: {
          backupId: backup.backupId,
          walletAddress: backup.address,
          createdAt: backup.createdAt,
          version: backup.version,
        },
      });
    } catch (error) {
      console.error("❌ Backup creation failed:", error);
      res.status(500).json({
        success: false,
        message: "Backup creation failed",
        code: "BACKUP_CREATION_ERROR",
      });
    }
  }

  /**
   * 백업에서 지갑 복원 API
   * POST /api/keys/restore-from-backup
   */
  async restoreFromBackup(req, res) {
    try {
      const { backupId, password } = req.body;
      const userId = req.user?.userId;

      if (!backupId || !password) {
        return res.status(400).json({
          success: false,
          message: "Backup ID and password are required",
          code: "BACKUP_ID_PASSWORD_REQUIRED",
        });
      }

      // 백업 조회
      const backup = this.walletBackups.get(backupId);
      if (!backup) {
        return res.status(404).json({
          success: false,
          message: "Backup not found",
          code: "BACKUP_NOT_FOUND",
        });
      }

      // 백업에서 복원
      const restorationResult = this.keyManagementService.restoreFromBackup(
        backup,
        password
      );

      // 보안 이벤트 로깅
      if (userId) {
        this.authService.logSecurityEvent(
          userId,
          "wallet_restored_from_backup",
          {
            walletAddress: restorationResult.wallet.address,
            backupId: restorationResult.backupId,
            restoredAt: restorationResult.restoredAt,
          }
        );
      }

      res.status(200).json({
        success: true,
        message: "Wallet restored from backup successfully",
        data: {
          wallet: {
            address: restorationResult.wallet.address,
            publicKey: restorationResult.wallet.publicKey,
          },
          backupId: restorationResult.backupId,
          restoredAt: restorationResult.restoredAt,
        },
      });
    } catch (error) {
      console.error("❌ Backup restoration failed:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Backup restoration failed",
        code: "BACKUP_RESTORATION_ERROR",
      });
    }
  }

  /**
   * 사용자의 백업 목록 조회 API
   * GET /api/keys/backups
   */
  async getBackups(req, res) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      // 실제 구현에서는 DB에서 사용자의 백업 목록을 조회
      const userBackups = Array.from(this.walletBackups.values()).filter(
        (backup) => {
          // 실제로는 backup에 userId 필드가 있어야 함
          return true; // 임시로 모든 백업 반환
        }
      );

      res.status(200).json({
        success: true,
        message: "Backups retrieved successfully",
        data: {
          backups: userBackups.map((backup) => ({
            backupId: backup.backupId,
            walletAddress: backup.address,
            createdAt: backup.createdAt,
            version: backup.version,
            // encryptedMnemonic은 보안상 반환하지 않음
          })),
          count: userBackups.length,
        },
      });
    } catch (error) {
      console.error("❌ Backup retrieval failed:", error);
      res.status(500).json({
        success: false,
        message: "Backup retrieval failed",
        code: "BACKUP_RETRIEVAL_ERROR",
      });
    }
  }
}

module.exports = KeyController;
