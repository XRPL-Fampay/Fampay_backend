const AuthService = require("../services/authService");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

/**
 * 인증 및 보안 미들웨어
 * 개발자 2 담당 - 보안 중심 구현
 */
class AuthMiddleware {
  constructor() {
    this.authService = new AuthService();
  }

  /**
   * JWT 토큰 검증 미들웨어
   * @returns {Function} Express 미들웨어 함수
   */
  authenticateToken() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

        if (!token) {
          return res.status(401).json({
            success: false,
            message: "Access token required",
            code: "TOKEN_REQUIRED",
          });
        }

        // 토큰 검증
        const decoded = this.authService.verifyToken(token, "access");

        // 요청 객체에 사용자 정보 추가
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          walletAddress: decoded.walletAddress,
          familyRole: decoded.familyRole,
          tokenIat: decoded.iat,
          tokenExp: decoded.exp,
        };

        // 보안 이벤트 로깅
        this.authService.logSecurityEvent(decoded.userId, "token_verified", {
          endpoint: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        });

        next();
      } catch (error) {
        console.error("❌ Token authentication failed:", error.message);

        // 토큰 관련 에러 처리
        let statusCode = 401;
        let errorCode = "TOKEN_INVALID";
        let message = "Invalid access token";

        if (error.name === "TokenExpiredError") {
          statusCode = 401;
          errorCode = "TOKEN_EXPIRED";
          message = "Access token expired";
        } else if (error.name === "JsonWebTokenError") {
          statusCode = 401;
          errorCode = "TOKEN_MALFORMED";
          message = "Malformed access token";
        }

        return res.status(statusCode).json({
          success: false,
          message,
          code: errorCode,
        });
      }
    };
  }

  /**
   * 역할 기반 접근 제어 미들웨어
   * @param {Array} allowedRoles - 허용된 역할 배열
   * @returns {Function} Express 미들웨어 함수
   */
  requireRole(allowedRoles = []) {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: "Authentication required",
            code: "AUTH_REQUIRED",
          });
        }

        const userRole = req.user.familyRole;

        if (!allowedRoles.includes(userRole)) {
          // 보안 이벤트 로깅
          this.authService.logSecurityEvent(req.user.userId, "access_denied", {
            requiredRoles: allowedRoles,
            userRole: userRole,
            endpoint: req.path,
            method: req.method,
          });

          return res.status(403).json({
            success: false,
            message: "Insufficient permissions",
            code: "INSUFFICIENT_PERMISSIONS",
            required: allowedRoles,
            current: userRole,
          });
        }

        next();
      } catch (error) {
        console.error("❌ Role authorization failed:", error);
        return res.status(500).json({
          success: false,
          message: "Authorization check failed",
          code: "AUTH_CHECK_ERROR",
        });
      }
    };
  }

  /**
   * 지갑 소유권 검증 미들웨어
   * @returns {Function} Express 미들웨어 함수
   */
  verifyWalletOwnership() {
    return (req, res, next) => {
      try {
        const { walletAddress } = req.body;
        const userWalletAddress = req.user?.walletAddress;

        if (!walletAddress) {
          return res.status(400).json({
            success: false,
            message: "Wallet address required",
            code: "WALLET_ADDRESS_REQUIRED",
          });
        }

        if (walletAddress !== userWalletAddress) {
          // 보안 이벤트 로깅
          this.authService.logSecurityEvent(
            req.user.userId,
            "wallet_ownership_violation",
            {
              requestedWallet: walletAddress,
              userWallet: userWalletAddress,
              endpoint: req.path,
            }
          );

          return res.status(403).json({
            success: false,
            message: "Wallet ownership verification failed",
            code: "WALLET_OWNERSHIP_DENIED",
          });
        }

        next();
      } catch (error) {
        console.error("❌ Wallet ownership verification failed:", error);
        return res.status(500).json({
          success: false,
          message: "Wallet verification failed",
          code: "WALLET_VERIFICATION_ERROR",
        });
      }
    };
  }

  /**
   * API 요청 속도 제한 미들웨어
   * @param {Object} options - Rate limit 옵션
   * @returns {Function} Express 미들웨어 함수
   */
  createRateLimit(options = {}) {
    const defaultOptions = {
      windowMs: 15 * 60 * 1000, // 15분
      max: 100, // 최대 100 요청
      message: {
        success: false,
        message: "Too many requests, please try again later",
        code: "RATE_LIMIT_EXCEEDED",
      },
      standardHeaders: true,
      legacyHeaders: false,
      // 사용자별 제한
      keyGenerator: (req) => {
        return req.user?.userId || req.ip;
      },
      // 제한 초과 시 로깅
      onLimitReached: (req, res, options) => {
        const userId = req.user?.userId || "anonymous";
        console.warn(
          `🚨 Rate limit exceeded for user: ${userId}, IP: ${req.ip}`
        );

        if (req.user?.userId) {
          this.authService.logSecurityEvent(
            req.user.userId,
            "rate_limit_exceeded",
            {
              endpoint: req.path,
              ip: req.ip,
              userAgent: req.headers["user-agent"],
            }
          );
        }
      },
    };

    return rateLimit({ ...defaultOptions, ...options });
  }

  /**
   * 로그인 시도 제한 미들웨어
   * @returns {Function} Express 미들웨어 함수
   */
  loginRateLimit() {
    return this.createRateLimit({
      windowMs: 15 * 60 * 1000, // 15분
      max: 5, // 최대 5번 시도
      skipSuccessfulRequests: true, // 성공한 요청은 카운트하지 않음
      message: {
        success: false,
        message: "Too many login attempts, please try again in 15 minutes",
        code: "LOGIN_RATE_LIMIT_EXCEEDED",
      },
      keyGenerator: (req) => {
        // 이메일 또는 IP 기반으로 제한
        return req.body?.email || req.ip;
      },
    });
  }

  /**
   * 보안 헤더 설정 미들웨어
   * @returns {Function} Express 미들웨어 함수
   */
  securityHeaders() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "wss://s.devnet.rippletest.net:51233"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1년
        includeSubDomains: true,
        preload: true,
      },
    });
  }

  /**
   * CORS 설정 미들웨어
   * @returns {Function} Express 미들웨어 함수
   */
  corsConfig() {
    return (req, res, next) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://fampay-app.com",
      ];

      const origin = req.headers.origin;

      if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      }

      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Max-Age", "86400"); // 24시간

      if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
      }

      next();
    };
  }

  /**
   * 요청 로깅 미들웨어
   * @returns {Function} Express 미들웨어 함수
   */
  requestLogger() {
    return (req, res, next) => {
      const startTime = Date.now();

      // 응답 완료 시 로깅
      res.on("finish", () => {
        const duration = Date.now() - startTime;
        const userId = req.user?.userId || "anonymous";

        console.log(
          `📝 API Request: ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - User: ${userId}`
        );

        // 민감한 엔드포인트 접근 로깅
        const sensitiveEndpoints = [
          "/api/auth/login",
          "/api/auth/register",
          "/api/wallet",
          "/api/payment",
        ];
        const isSensitive = sensitiveEndpoints.some((endpoint) =>
          req.path.startsWith(endpoint)
        );

        if (isSensitive && req.user?.userId) {
          this.authService.logSecurityEvent(
            req.user.userId,
            "sensitive_endpoint_access",
            {
              endpoint: req.path,
              method: req.method,
              statusCode: res.statusCode,
              duration,
              ip: req.ip,
              userAgent: req.headers["user-agent"],
            }
          );
        }
      });

      next();
    };
  }

  /**
   * 입력 데이터 검증 미들웨어
   * @param {Object} schema - 검증 스키마
   * @returns {Function} Express 미들웨어 함수
   */
  validateInput(schema) {
    return (req, res, next) => {
      try {
        const { error, value } = schema.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,
        });

        if (error) {
          const validationErrors = error.details.map((detail) => ({
            field: detail.path.join("."),
            message: detail.message,
            value: detail.context?.value,
          }));

          return res.status(400).json({
            success: false,
            message: "Validation failed",
            code: "VALIDATION_ERROR",
            errors: validationErrors,
          });
        }

        // 검증된 데이터로 교체
        req.body = value;
        next();
      } catch (error) {
        console.error("❌ Input validation error:", error);
        return res.status(500).json({
          success: false,
          message: "Validation process failed",
          code: "VALIDATION_PROCESS_ERROR",
        });
      }
    };
  }

  /**
   * 세션 관리 미들웨어
   * @returns {Function} Express 미들웨어 함수
   */
  sessionManager() {
    return (req, res, next) => {
      // 세션 정보를 요청 객체에 추가
      if (req.user) {
        req.session = {
          userId: req.user.userId,
          sessionId: req.headers["x-session-id"] || "unknown",
          lastActivity: new Date().toISOString(),
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        };
      }

      next();
    };
  }

  /**
   * 에러 핸들링 미들웨어
   * @returns {Function} Express 에러 미들웨어 함수
   */
  errorHandler() {
    return (err, req, res, next) => {
      console.error("🚨 Middleware Error:", err);

      // 보안 이벤트 로깅
      if (req.user?.userId) {
        this.authService.logSecurityEvent(req.user.userId, "middleware_error", {
          error: err.message,
          stack: err.stack,
          endpoint: req.path,
          method: req.method,
        });
      }

      // 에러 타입별 처리
      if (err.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          code: "VALIDATION_ERROR",
          details: err.message,
        });
      }

      if (err.name === "UnauthorizedError") {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        });
      }

      // 기본 서버 에러
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    };
  }
}

module.exports = AuthMiddleware;
