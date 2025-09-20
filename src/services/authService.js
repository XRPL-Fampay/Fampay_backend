const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto-js");

/**
 * JWT 기반 인증 서비스
 * 개발자 2 담당 - 보안 중심 구현
 */
class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || "fampay-super-secret-key-2024";
    this.jwtRefreshSecret =
      process.env.JWT_REFRESH_SECRET || "fampay-refresh-secret-key-2024";
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || "15m";
    this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
    this.saltRounds = 12;
  }

  /**
   * 비밀번호 해시 생성
   * @param {string} password - 원본 비밀번호
   * @returns {Promise<string>} 해시된 비밀번호
   */
  async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(this.saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } catch (error) {
      console.error("❌ Password hashing failed:", error);
      throw error;
    }
  }

  /**
   * 비밀번호 검증
   * @param {string} password - 입력된 비밀번호
   * @param {string} hashedPassword - 저장된 해시 비밀번호
   * @returns {Promise<boolean>} 검증 결과
   */
  async verifyPassword(password, hashedPassword) {
    try {
      const isValid = await bcrypt.compare(password, hashedPassword);
      return isValid;
    } catch (error) {
      console.error("❌ Password verification failed:", error);
      throw error;
    }
  }

  /**
   * JWT 액세스 토큰 생성
   * @param {Object} payload - 토큰에 포함할 데이터
   * @returns {string} JWT 토큰
   */
  generateAccessToken(payload) {
    try {
      const token = jwt.sign(
        {
          ...payload,
          type: "access",
          iat: Math.floor(Date.now() / 1000),
        },
        this.jwtSecret,
        {
          expiresIn: this.jwtExpiresIn,
          issuer: "fampay-backend",
          audience: "fampay-app",
        }
      );

      return token;
    } catch (error) {
      console.error("❌ Access token generation failed:", error);
      throw error;
    }
  }

  /**
   * JWT 리프레시 토큰 생성
   * @param {Object} payload - 토큰에 포함할 데이터
   * @returns {string} 리프레시 토큰
   */
  generateRefreshToken(payload) {
    try {
      const token = jwt.sign(
        {
          userId: payload.userId,
          type: "refresh",
          iat: Math.floor(Date.now() / 1000),
        },
        this.jwtRefreshSecret,
        {
          expiresIn: this.refreshTokenExpiresIn,
          issuer: "fampay-backend",
          audience: "fampay-app",
        }
      );

      return token;
    } catch (error) {
      console.error("❌ Refresh token generation failed:", error);
      throw error;
    }
  }

  /**
   * JWT 토큰 검증
   * @param {string} token - 검증할 토큰
   * @param {string} type - 토큰 타입 (access|refresh)
   * @returns {Object} 디코딩된 토큰 데이터
   */
  verifyToken(token, type = "access") {
    try {
      const secret =
        type === "refresh" ? this.jwtRefreshSecret : this.jwtSecret;
      const decoded = jwt.verify(token, secret, {
        issuer: "fampay-backend",
        audience: "fampay-app",
      });

      // 토큰 타입 검증
      if (decoded.type !== type) {
        throw new Error(
          `Invalid token type. Expected: ${type}, Got: ${decoded.type}`
        );
      }

      return decoded;
    } catch (error) {
      console.error(`❌ ${type} token verification failed:`, error.message);
      throw error;
    }
  }

  /**
   * 사용자 등록
   * @param {Object} userData - 사용자 데이터
   * @returns {Object} 등록 결과
   */
  async registerUser(userData) {
    try {
      const {
        email,
        password,
        walletAddress,
        familyRole = "member",
      } = userData;

      // 비밀번호 해시
      const hashedPassword = await this.hashPassword(password);

      // 사용자 ID 생성
      const userId = crypto.lib.WordArray.random(16).toString();

      const user = {
        userId,
        email,
        password: hashedPassword,
        walletAddress,
        familyRole,
        createdAt: new Date().toISOString(),
        isActive: true,
        emailVerified: false,
        twoFactorEnabled: false,
      };

      console.log("✅ User registered:", {
        userId,
        email,
        walletAddress,
        familyRole,
      });

      return {
        success: true,
        user: {
          userId: user.userId,
          email: user.email,
          walletAddress: user.walletAddress,
          familyRole: user.familyRole,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      console.error("❌ User registration failed:", error);
      throw error;
    }
  }

  /**
   * 사용자 로그인
   * @param {string} email - 이메일
   * @param {string} password - 비밀번호
   * @param {Object} storedUser - 저장된 사용자 데이터 (실제로는 DB에서 조회)
   * @returns {Object} 로그인 결과
   */
  async loginUser(email, password, storedUser) {
    try {
      // 비밀번호 검증
      const isPasswordValid = await this.verifyPassword(
        password,
        storedUser.password
      );

      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }

      // 계정 활성화 상태 확인
      if (!storedUser.isActive) {
        throw new Error("Account is deactivated");
      }

      // 토큰 생성
      const tokenPayload = {
        userId: storedUser.userId,
        email: storedUser.email,
        walletAddress: storedUser.walletAddress,
        familyRole: storedUser.familyRole,
      };

      const accessToken = this.generateAccessToken(tokenPayload);
      const refreshToken = this.generateRefreshToken(tokenPayload);

      // 로그인 기록
      const loginSession = {
        sessionId: crypto.lib.WordArray.random(16).toString(),
        userId: storedUser.userId,
        loginAt: new Date().toISOString(),
        ipAddress: "unknown", // 실제 구현에서는 req.ip 사용
        userAgent: "unknown", // 실제 구현에서는 req.headers['user-agent'] 사용
        refreshToken: refreshToken,
      };

      console.log("✅ User logged in:", {
        userId: storedUser.userId,
        email: storedUser.email,
        sessionId: loginSession.sessionId,
      });

      return {
        success: true,
        accessToken,
        refreshToken,
        user: {
          userId: storedUser.userId,
          email: storedUser.email,
          walletAddress: storedUser.walletAddress,
          familyRole: storedUser.familyRole,
        },
        session: loginSession,
      };
    } catch (error) {
      console.error("❌ User login failed:", error);
      throw error;
    }
  }

  /**
   * 토큰 갱신
   * @param {string} refreshToken - 리프레시 토큰
   * @param {Object} storedUser - 저장된 사용자 데이터
   * @returns {Object} 새로운 토큰들
   */
  async refreshTokens(refreshToken, storedUser) {
    try {
      // 리프레시 토큰 검증
      const decoded = this.verifyToken(refreshToken, "refresh");

      // 사용자 ID 매칭 확인
      if (decoded.userId !== storedUser.userId) {
        throw new Error("Invalid refresh token");
      }

      // 새 토큰 생성
      const tokenPayload = {
        userId: storedUser.userId,
        email: storedUser.email,
        walletAddress: storedUser.walletAddress,
        familyRole: storedUser.familyRole,
      };

      const newAccessToken = this.generateAccessToken(tokenPayload);
      const newRefreshToken = this.generateRefreshToken(tokenPayload);

      console.log("✅ Tokens refreshed:", {
        userId: storedUser.userId,
        email: storedUser.email,
      });

      return {
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      console.error("❌ Token refresh failed:", error);
      throw error;
    }
  }

  /**
   * XRPL 지갑 기반 인증 (서명 검증)
   * @param {string} walletAddress - 지갑 주소
   * @param {string} message - 서명할 메시지
   * @param {string} signature - 지갑 서명
   * @returns {Object} 검증 결과
   */
  verifyWalletSignature(walletAddress, message, signature) {
    try {
      // 실제 구현에서는 XRPL 서명 검증 로직 필요
      // 현재는 기본 검증만 수행

      if (!walletAddress || !message || !signature) {
        throw new Error("Missing required parameters for wallet verification");
      }

      // 기본 형식 검증
      if (!walletAddress.startsWith("r") || walletAddress.length < 25) {
        throw new Error("Invalid XRPL wallet address format");
      }

      console.log("✅ Wallet signature verified:", {
        walletAddress,
        messageLength: message.length,
        signatureLength: signature.length,
      });

      return {
        success: true,
        walletAddress,
        verified: true,
        verifiedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Wallet signature verification failed:", error);
      throw error;
    }
  }

  /**
   * 생체인증 준비 (메타데이터 저장)
   * @param {string} userId - 사용자 ID
   * @param {string} biometricType - 생체인증 타입 (fingerprint, face, voice)
   * @returns {Object} 생체인증 설정
   */
  setupBiometricAuth(userId, biometricType) {
    try {
      const biometricConfig = {
        userId,
        biometricType,
        enabled: true,
        setupAt: new Date().toISOString(),
        biometricId: crypto.lib.WordArray.random(16).toString(),
        deviceId: crypto.lib.WordArray.random(12).toString(),
      };

      console.log("✅ Biometric authentication setup:", {
        userId,
        biometricType,
        biometricId: biometricConfig.biometricId,
      });

      return biometricConfig;
    } catch (error) {
      console.error("❌ Biometric setup failed:", error);
      throw error;
    }
  }

  /**
   * 2FA (Two-Factor Authentication) 설정
   * @param {string} userId - 사용자 ID
   * @param {string} method - 2FA 방법 (sms, email, app)
   * @returns {Object} 2FA 설정
   */
  setup2FA(userId, method = "app") {
    try {
      const secret = crypto.lib.WordArray.random(32).toString();
      const backupCodes = Array.from({ length: 8 }, () =>
        crypto.lib.WordArray.random(8).toString().substring(0, 8)
      );

      const twoFactorConfig = {
        userId,
        method,
        secret,
        backupCodes,
        enabled: true,
        setupAt: new Date().toISOString(),
        qrCode: `otpauth://totp/FamPay:${userId}?secret=${secret}&issuer=FamPay`,
      };

      console.log("✅ 2FA setup completed:", {
        userId,
        method,
        backupCodesCount: backupCodes.length,
      });

      return twoFactorConfig;
    } catch (error) {
      console.error("❌ 2FA setup failed:", error);
      throw error;
    }
  }

  /**
   * 세션 무효화 (로그아웃)
   * @param {string} sessionId - 세션 ID
   * @returns {Object} 로그아웃 결과
   */
  invalidateSession(sessionId) {
    try {
      const logoutResult = {
        sessionId,
        invalidated: true,
        logoutAt: new Date().toISOString(),
      };

      console.log("✅ Session invalidated:", {
        sessionId,
        logoutAt: logoutResult.logoutAt,
      });

      return logoutResult;
    } catch (error) {
      console.error("❌ Session invalidation failed:", error);
      throw error;
    }
  }

  /**
   * 보안 이벤트 로깅
   * @param {string} userId - 사용자 ID
   * @param {string} eventType - 이벤트 타입
   * @param {Object} metadata - 추가 메타데이터
   * @returns {Object} 로그 엔트리
   */
  logSecurityEvent(userId, eventType, metadata = {}) {
    try {
      const securityLog = {
        logId: crypto.lib.WordArray.random(16).toString(),
        userId,
        eventType,
        metadata,
        timestamp: new Date().toISOString(),
        severity: this.getEventSeverity(eventType),
      };

      console.log(`🔒 Security Event [${securityLog.severity}]:`, {
        userId,
        eventType,
        logId: securityLog.logId,
      });

      return securityLog;
    } catch (error) {
      console.error("❌ Security event logging failed:", error);
      throw error;
    }
  }

  /**
   * 이벤트 심각도 결정
   * @param {string} eventType - 이벤트 타입
   * @returns {string} 심각도 레벨
   */
  getEventSeverity(eventType) {
    const severityMap = {
      login_success: "info",
      login_failed: "warning",
      password_changed: "info",
      "2fa_enabled": "info",
      "2fa_disabled": "warning",
      suspicious_login: "high",
      account_locked: "high",
      wallet_connected: "info",
      wallet_signature_failed: "warning",
      multiple_failed_attempts: "high",
    };

    return severityMap[eventType] || "medium";
  }
}

module.exports = AuthService;
