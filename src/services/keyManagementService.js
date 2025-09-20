const xrpl = require("xrpl");
const bip39 = require("bip39");
const crypto = require("crypto-js");

/**
 * 키 관리 서비스 - 니모닉, 멀티시그, 소셜 리커버리
 * 개발자 2 담당 - 보안 중심 구현
 */
class KeyManagementService {
  constructor() {
    this.client = null;
    this.serverUrl =
      process.env.XRPL_SERVER || "wss://s.devnet.rippletest.net:51233";
  }

  async connect() {
    if (this.client && this.client.isConnected()) {
      return;
    }

    try {
      this.client = new xrpl.Client(this.serverUrl);
      await this.client.connect();
      console.log("✅ Key Management Service connected to:", this.serverUrl);
    } catch (error) {
      console.error("❌ Key Management Service connection failed:", error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client && this.client.isConnected()) {
      await this.client.disconnect();
      console.log("✅ Key Management Service disconnected");
    }
  }

  /**
   * 니모닉 구문 생성 (12단어 또는 24단어)
   * @param {number} strength - 128 (12단어) 또는 256 (24단어)
   * @returns {Object} 니모닉과 지갑 정보
   */
  generateMnemonic(strength = 128) {
    try {
      // BIP39 니모닉 생성
      const mnemonic = bip39.generateMnemonic(strength);

      // XRPL 지갑 생성 (니모닉 대신 랜덤 생성)
      const wallet = xrpl.Wallet.generate();

      return {
        mnemonic,
        wallet: {
          address: wallet.address,
          publicKey: wallet.publicKey,
          privateKey: wallet.privateKey,
          seed: wallet.seed,
        },
        strength,
        wordCount: strength === 128 ? 12 : 24,
      };
    } catch (error) {
      console.error("❌ Mnemonic generation failed:", error);
      throw error;
    }
  }

  /**
   * 니모닉에서 지갑 복구
   * @param {string} mnemonic - 니모닉 구문
   * @returns {Object} 복구된 지갑 정보
   */
  recoverFromMnemonic(mnemonic) {
    try {
      // 니모닉 유효성 검증
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error("Invalid mnemonic phrase");
      }

      // 실제 구현에서는 니모닉에서 지갑을 복구해야 하지만,
      // 현재는 데모용으로 새 지갑 생성
      const wallet = xrpl.Wallet.generate();

      return {
        wallet: {
          address: wallet.address,
          publicKey: wallet.publicKey,
          privateKey: wallet.privateKey,
          seed: wallet.seed,
        },
        recovered: true,
      };
    } catch (error) {
      console.error("❌ Wallet recovery failed:", error);
      throw error;
    }
  }

  /**
   * 니모닉 암호화 저장
   * @param {string} mnemonic - 니모닉 구문
   * @param {string} password - 암호화 비밀번호
   * @returns {string} 암호화된 니모닉
   */
  encryptMnemonic(mnemonic, password) {
    try {
      const encrypted = crypto.AES.encrypt(mnemonic, password).toString();
      return encrypted;
    } catch (error) {
      console.error("❌ Mnemonic encryption failed:", error);
      throw error;
    }
  }

  /**
   * 암호화된 니모닉 복호화
   * @param {string} encryptedMnemonic - 암호화된 니모닉
   * @param {string} password - 복호화 비밀번호
   * @returns {string} 복호화된 니모닉
   */
  decryptMnemonic(encryptedMnemonic, password) {
    try {
      const decrypted = crypto.AES.decrypt(encryptedMnemonic, password);
      const mnemonic = decrypted.toString(crypto.enc.Utf8);

      if (!mnemonic) {
        throw new Error("Invalid password or corrupted mnemonic");
      }

      return mnemonic;
    } catch (error) {
      console.error("❌ Mnemonic decryption failed:", error);
      throw error;
    }
  }

  /**
   * 멀티시그 지갑 설정 (2/3 승인)
   * @param {Array} signers - 서명자 배열 [address1, address2, address3]
   * @param {string} masterSeed - 마스터 지갑 시드
   * @returns {Object} 멀티시그 설정 결과
   */
  async setupMultiSig(signers, masterSeed) {
    await this.connect();

    try {
      const masterWallet = xrpl.Wallet.fromSeed(masterSeed);

      // SignerListSet 트랜잭션 생성
      const signerList = signers.map((address, index) => ({
        SignerEntry: {
          Account: address,
          SignerWeight: 1, // 각 서명자의 가중치
        },
      }));

      const tx = {
        TransactionType: "SignerListSet",
        Account: masterWallet.address,
        SignerQuorum: 2, // 2/3 승인 필요
        SignerEntries: signerList,
      };

      const prepared = await this.client.autofill(tx);
      const signed = masterWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log("✅ MultiSig setup completed:", {
        hash: result.result.hash,
        account: masterWallet.address,
        signers: signers,
        quorum: 2,
      });

      return {
        success: true,
        hash: result.result.hash,
        account: masterWallet.address,
        signers,
        quorum: 2,
        setup: true,
      };
    } catch (error) {
      console.error("❌ MultiSig setup failed:", error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  /**
   * 소셜 리커버리 설정
   * @param {string} userAddress - 사용자 지갑 주소
   * @param {Array} guardians - 가디언 주소 배열
   * @param {number} threshold - 복구에 필요한 최소 가디언 수
   * @returns {Object} 소셜 리커버리 설정 정보
   */
  setupSocialRecovery(userAddress, guardians, threshold = 2) {
    try {
      if (guardians.length < threshold) {
        throw new Error("Guardian count must be >= threshold");
      }

      // 복구 설정 정보 생성
      const recoveryConfig = {
        userAddress,
        guardians,
        threshold,
        createdAt: new Date().toISOString(),
        recoveryId: crypto.lib.WordArray.random(16).toString(),
      };

      console.log("✅ Social Recovery setup:", {
        user: userAddress,
        guardians: guardians.length,
        threshold,
        recoveryId: recoveryConfig.recoveryId,
      });

      return recoveryConfig;
    } catch (error) {
      console.error("❌ Social Recovery setup failed:", error);
      throw error;
    }
  }

  /**
   * 소셜 리커버리 실행
   * @param {string} recoveryId - 복구 ID
   * @param {Array} guardianSignatures - 가디언 서명 배열
   * @param {string} newMnemonic - 새로운 니모닉
   * @returns {Object} 복구 결과
   */
  executeSocialRecovery(recoveryId, guardianSignatures, newMnemonic) {
    try {
      // 서명 검증 (실제 구현에서는 더 복잡한 검증 필요)
      if (guardianSignatures.length < 2) {
        throw new Error("Insufficient guardian signatures");
      }

      // 새 지갑 생성
      const newWallet = this.recoverFromMnemonic(newMnemonic);

      console.log("✅ Social Recovery executed:", {
        recoveryId,
        signaturesCount: guardianSignatures.length,
        newAddress: newWallet.wallet.address,
      });

      return {
        success: true,
        recoveryId,
        newWallet: newWallet.wallet,
        recoveredAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Social Recovery execution failed:", error);
      throw error;
    }
  }

  /**
   * 하이브리드 커스터디 옵션 설정
   * @param {string} userSeed - 사용자 시드
   * @param {Object} options - 커스터디 옵션
   * @returns {Object} 하이브리드 커스터디 설정
   */
  setupHybridCustody(userSeed, options = {}) {
    try {
      const {
        enableSelfCustody = true,
        enableSharedCustody = true,
        enableFullCustody = false,
        custodyThreshold = 1,
      } = options;

      const userWallet = xrpl.Wallet.fromSeed(userSeed);

      const custodyConfig = {
        userAddress: userWallet.address,
        selfCustody: enableSelfCustody,
        sharedCustody: enableSharedCustody,
        fullCustody: enableFullCustody,
        threshold: custodyThreshold,
        createdAt: new Date().toISOString(),
        custodyId: crypto.lib.WordArray.random(16).toString(),
      };

      console.log("✅ Hybrid Custody setup:", custodyConfig);

      return custodyConfig;
    } catch (error) {
      console.error("❌ Hybrid Custody setup failed:", error);
      throw error;
    }
  }

  /**
   * 지갑 백업 생성 (암호화된)
   * @param {string} mnemonic - 니모닉
   * @param {string} password - 백업 비밀번호
   * @returns {Object} 백업 데이터
   */
  createWalletBackup(mnemonic, password) {
    try {
      const wallet = this.recoverFromMnemonic(mnemonic);
      const encryptedMnemonic = this.encryptMnemonic(mnemonic, password);

      const backup = {
        encryptedMnemonic,
        address: wallet.wallet.address,
        publicKey: wallet.wallet.publicKey,
        backupId: crypto.lib.WordArray.random(16).toString(),
        createdAt: new Date().toISOString(),
        version: "1.0",
      };

      console.log("✅ Wallet backup created:", {
        address: backup.address,
        backupId: backup.backupId,
      });

      return backup;
    } catch (error) {
      console.error("❌ Wallet backup creation failed:", error);
      throw error;
    }
  }

  /**
   * 백업에서 지갑 복구
   * @param {Object} backup - 백업 데이터
   * @param {string} password - 백업 비밀번호
   * @returns {Object} 복구된 지갑
   */
  restoreFromBackup(backup, password) {
    try {
      const mnemonic = this.decryptMnemonic(backup.encryptedMnemonic, password);
      const wallet = this.recoverFromMnemonic(mnemonic);

      // 주소 검증
      if (wallet.wallet.address !== backup.address) {
        throw new Error("Backup verification failed - address mismatch");
      }

      console.log("✅ Wallet restored from backup:", {
        address: wallet.wallet.address,
        backupId: backup.backupId,
      });

      return {
        ...wallet,
        backupId: backup.backupId,
        restoredAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Wallet restoration failed:", error);
      throw error;
    }
  }
}

module.exports = KeyManagementService;
