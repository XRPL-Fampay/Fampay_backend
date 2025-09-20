const AuthService = require("../services/authService");
const KeyManagementService = require("../services/keyManagementService");

/**
 * 인증 관련 API 컨트롤러
 * 개발자 2 담당 - 보안 중심 구현
 */
class AuthController {
  constructor() {
    this.authService = new AuthService();
    this.keyManagementService = new KeyManagementService();
    // 실제 구현에서는 데이터베이스 연결 필요
    this.users = new Map(); // 임시 사용자 저장소
    this.sessions = new Map(); // 임시 세션 저장소
  }

  /**
   * 사용자 회원가입 API
   * POST /api/auth/register
   */
  async register(req, res) {
    try {
      const { email, password, confirmPassword, walletAddress, familyRole } =
        req.body;

      // 기본 검증
      if (!email || !password || !confirmPassword || !walletAddress) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: email, password, confirmPassword, walletAddress",
          code: "MISSING_FIELDS",
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Passwords do not match",
          code: "PASSWORD_MISMATCH",
        });
      }

      // 이메일 중복 확인 (실제로는 DB 조회)
      if (this.users.has(email)) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
          code: "EMAIL_EXISTS",
        });
      }

      // 사용자 등록
      const registrationResult = await this.authService.registerUser({
        email,
        password,
        walletAddress,
        familyRole: familyRole || "member",
      });

      // 임시 저장 (실제로는 DB에 저장)
      this.users.set(email, {
        userId: registrationResult.user.userId,
        email: registrationResult.user.email,
        password: await this.authService.hashPassword(password),
        walletAddress: registrationResult.user.walletAddress,
        familyRole: registrationResult.user.familyRole,
        createdAt: registrationResult.user.createdAt,
        isActive: true,
        emailVerified: false,
        twoFactorEnabled: false,
      });

      // 보안 이벤트 로깅
      this.authService.logSecurityEvent(
        registrationResult.user.userId,
        "user_registered",
        {
          email,
          walletAddress,
          familyRole: registrationResult.user.familyRole,
        }
      );

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          userId: registrationResult.user.userId,
          email: registrationResult.user.email,
          walletAddress: registrationResult.user.walletAddress,
          familyRole: registrationResult.user.familyRole,
        },
      });
    } catch (error) {
      console.error("❌ Registration failed:", error);
      res.status(500).json({
        success: false,
        message: "Registration failed",
        code: "REGISTRATION_ERROR",
      });
    }
  }

  /**
   * 사용자 로그인 API
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
          code: "MISSING_CREDENTIALS",
        });
      }

      // 사용자 조회 (실제로는 DB에서 조회)
      const storedUser = this.users.get(email);
      if (!storedUser) {
        // 보안 이벤트 로깅
        this.authService.logSecurityEvent("unknown", "login_failed", {
          email,
          reason: "user_not_found",
          ip: req.ip,
        });

        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
          code: "INVALID_CREDENTIALS",
        });
      }

      // 로그인 처리
      const loginResult = await this.authService.loginUser(
        email,
        password,
        storedUser
      );

      // 세션 저장 (실제로는 DB 또는 Redis에 저장)
      this.sessions.set(loginResult.session.sessionId, loginResult.session);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          accessToken: loginResult.accessToken,
          refreshToken: loginResult.refreshToken,
          user: loginResult.user,
          sessionId: loginResult.session.sessionId,
        },
      });
    } catch (error) {
      console.error("❌ Login failed:", error);

      // 로그인 실패 로깅
      if (req.body?.email) {
        this.authService.logSecurityEvent("unknown", "login_failed", {
          email: req.body.email,
          error: error.message,
          ip: req.ip,
        });
      }

      res.status(401).json({
        success: false,
        message: error.message || "Login failed",
        code: "LOGIN_ERROR",
      });
    }
  }

  /**
   * 토큰 갱신 API
   * POST /api/auth/refresh
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "Refresh token is required",
          code: "REFRESH_TOKEN_REQUIRED",
        });
      }

      // 토큰에서 사용자 정보 추출
      const decoded = this.authService.verifyToken(refreshToken, "refresh");

      // 사용자 조회
      const storedUser = Array.from(this.users.values()).find(
        (user) => user.userId === decoded.userId
      );
      if (!storedUser) {
        return res.status(401).json({
          success: false,
          message: "Invalid refresh token",
          code: "INVALID_REFRESH_TOKEN",
        });
      }

      // 새 토큰 생성
      const refreshResult = await this.authService.refreshTokens(
        refreshToken,
        storedUser
      );

      res.status(200).json({
        success: true,
        message: "Tokens refreshed successfully",
        data: {
          accessToken: refreshResult.accessToken,
          refreshToken: refreshResult.refreshToken,
        },
      });
    } catch (error) {
      console.error("❌ Token refresh failed:", error);
      res.status(401).json({
        success: false,
        message: "Token refresh failed",
        code: "REFRESH_ERROR",
      });
    }
  }

  /**
   * 로그아웃 API
   * POST /api/auth/logout
   */
  async logout(req, res) {
    try {
      const sessionId = req.headers["x-session-id"];
      const userId = req.user?.userId;

      if (sessionId) {
        // 세션 무효화
        this.authService.invalidateSession(sessionId);
        this.sessions.delete(sessionId);
      }

      // 보안 이벤트 로깅
      if (userId) {
        this.authService.logSecurityEvent(userId, "user_logout", {
          sessionId: sessionId || "unknown",
        });
      }

      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      console.error("❌ Logout failed:", error);
      res.status(500).json({
        success: false,
        message: "Logout failed",
        code: "LOGOUT_ERROR",
      });
    }
  }

  /**
   * 지갑 연결 API
   * POST /api/auth/connect-wallet
   */
  async connectWallet(req, res) {
    try {
      const { walletAddress, signature, message } = req.body;
      const userId = req.user?.userId;

      if (!walletAddress || !signature || !message) {
        return res.status(400).json({
          success: false,
          message: "Wallet address, signature, and message are required",
          code: "MISSING_WALLET_DATA",
        });
      }

      // 지갑 서명 검증
      const verificationResult = this.authService.verifyWalletSignature(
        walletAddress,
        message,
        signature
      );

      if (!verificationResult.success) {
        return res.status(401).json({
          success: false,
          message: "Wallet signature verification failed",
          code: "WALLET_VERIFICATION_FAILED",
        });
      }

      // 사용자 정보 업데이트 (실제로는 DB 업데이트)
      const userEmail = Array.from(this.users.entries()).find(
        ([email, user]) => user.userId === userId
      )?.[0];

      if (userEmail && this.users.has(userEmail)) {
        const user = this.users.get(userEmail);
        user.walletAddress = walletAddress;
        user.walletConnectedAt = new Date().toISOString();
        this.users.set(userEmail, user);
      }

      // 보안 이벤트 로깅
      this.authService.logSecurityEvent(userId, "wallet_connected", {
        walletAddress,
        verifiedAt: verificationResult.verifiedAt,
      });

      res.status(200).json({
        success: true,
        message: "Wallet connected successfully",
        data: {
          walletAddress,
          verified: true,
          connectedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("❌ Wallet connection failed:", error);
      res.status(500).json({
        success: false,
        message: "Wallet connection failed",
        code: "WALLET_CONNECTION_ERROR",
      });
    }
  }

  /**
   * 2FA 설정 API
   * POST /api/auth/setup-2fa
   */
  async setup2FA(req, res) {
    try {
      const { method } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      // 2FA 설정
      const twoFactorConfig = this.authService.setup2FA(userId, method);

      // 보안 이벤트 로깅
      this.authService.logSecurityEvent(userId, "2fa_enabled", {
        method: twoFactorConfig.method,
      });

      res.status(200).json({
        success: true,
        message: "2FA setup completed",
        data: {
          method: twoFactorConfig.method,
          qrCode: twoFactorConfig.qrCode,
          backupCodes: twoFactorConfig.backupCodes,
          secret: twoFactorConfig.secret, // 실제로는 보안상 클라이언트에 전송하지 않음
        },
      });
    } catch (error) {
      console.error("❌ 2FA setup failed:", error);
      res.status(500).json({
        success: false,
        message: "2FA setup failed",
        code: "2FA_SETUP_ERROR",
      });
    }
  }

  /**
   * 생체인증 설정 API
   * POST /api/auth/setup-biometric
   */
  async setupBiometric(req, res) {
    try {
      const { biometricType } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      if (
        !biometricType ||
        !["fingerprint", "face", "voice"].includes(biometricType)
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid biometric type required (fingerprint, face, voice)",
          code: "INVALID_BIOMETRIC_TYPE",
        });
      }

      // 생체인증 설정
      const biometricConfig = this.authService.setupBiometricAuth(
        userId,
        biometricType
      );

      // 보안 이벤트 로깅
      this.authService.logSecurityEvent(userId, "biometric_enabled", {
        biometricType: biometricConfig.biometricType,
        deviceId: biometricConfig.deviceId,
      });

      res.status(200).json({
        success: true,
        message: "Biometric authentication setup completed",
        data: {
          biometricType: biometricConfig.biometricType,
          biometricId: biometricConfig.biometricId,
          deviceId: biometricConfig.deviceId,
          setupAt: biometricConfig.setupAt,
        },
      });
    } catch (error) {
      console.error("❌ Biometric setup failed:", error);
      res.status(500).json({
        success: false,
        message: "Biometric setup failed",
        code: "BIOMETRIC_SETUP_ERROR",
      });
    }
  }

  /**
   * 사용자 프로필 조회 API
   * GET /api/auth/profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      // 사용자 정보 조회 (실제로는 DB에서 조회)
      const user = Array.from(this.users.values()).find(
        (u) => u.userId === userId
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      res.status(200).json({
        success: true,
        message: "Profile retrieved successfully",
        data: {
          userId: user.userId,
          email: user.email,
          walletAddress: user.walletAddress,
          familyRole: user.familyRole,
          createdAt: user.createdAt,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
        },
      });
    } catch (error) {
      console.error("❌ Profile retrieval failed:", error);
      res.status(500).json({
        success: false,
        message: "Profile retrieval failed",
        code: "PROFILE_ERROR",
      });
    }
  }

  /**
   * 비밀번호 변경 API
   * PUT /api/auth/change-password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword, confirmNewPassword } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      if (!currentPassword || !newPassword || !confirmNewPassword) {
        return res.status(400).json({
          success: false,
          message:
            "Current password, new password, and confirmation are required",
          code: "MISSING_PASSWORD_FIELDS",
        });
      }

      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({
          success: false,
          message: "New passwords do not match",
          code: "PASSWORD_MISMATCH",
        });
      }

      // 사용자 조회
      const user = Array.from(this.users.values()).find(
        (u) => u.userId === userId
      );
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      // 현재 비밀번호 검증
      const isCurrentPasswordValid = await this.authService.verifyPassword(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        // 보안 이벤트 로깅
        this.authService.logSecurityEvent(userId, "password_change_failed", {
          reason: "invalid_current_password",
        });

        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
          code: "INVALID_CURRENT_PASSWORD",
        });
      }

      // 새 비밀번호 해시화
      const newHashedPassword = await this.authService.hashPassword(
        newPassword
      );

      // 비밀번호 업데이트 (실제로는 DB 업데이트)
      const userEmail = Array.from(this.users.entries()).find(
        ([email, u]) => u.userId === userId
      )?.[0];

      if (userEmail && this.users.has(userEmail)) {
        const updatedUser = this.users.get(userEmail);
        updatedUser.password = newHashedPassword;
        updatedUser.passwordChangedAt = new Date().toISOString();
        this.users.set(userEmail, updatedUser);
      }

      // 보안 이벤트 로깅
      this.authService.logSecurityEvent(userId, "password_changed", {
        changedAt: new Date().toISOString(),
      });

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("❌ Password change failed:", error);
      res.status(500).json({
        success: false,
        message: "Password change failed",
        code: "PASSWORD_CHANGE_ERROR",
      });
    }
  }
}

module.exports = AuthController;
