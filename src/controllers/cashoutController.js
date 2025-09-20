const CashoutGatewayService = require("../services/cashoutGatewayService");
const AuthService = require("../services/authService");

/**
 * 현금화 관련 API 컨트롤러
 * 개발자 2 담당 - PermissionedDomains 기반 안전 출금
 */
class CashoutController {
  constructor() {
    this.cashoutService = new CashoutGatewayService();
    this.authService = new AuthService();
  }

  /**
   * PermissionedDomains 설정 API
   * POST /api/cashout/setup-domains
   */
  async setupPermissionedDomains(req, res) {
    try {
      const { adminSeed, allowedDomains } = req.body;
      const userId = req.user?.userId;

      if (!adminSeed || !allowedDomains || !Array.isArray(allowedDomains)) {
        return res.status(400).json({
          success: false,
          message: "Admin seed and allowed domains array are required",
          code: "MISSING_DOMAIN_INFO",
        });
      }

      // PermissionedDomains 설정
      const result = await this.cashoutService.setupPermissionedDomains(
        adminSeed,
        allowedDomains
      );

      // 보안 이벤트 로깅
      if (userId) {
        this.authService.logSecurityEvent(userId, "domains_setup", {
          domainsCount: allowedDomains.length,
          transactionHash: result.hash,
        });
      }

      res.status(200).json({
        success: true,
        message: "PermissionedDomains setup completed",
        data: {
          hash: result.hash,
          account: result.account,
          domainsCount: result.permissionedDomains.length,
          setupAt: result.setupAt,
        },
      });
    } catch (error) {
      console.error("❌ PermissionedDomains setup failed:", error);
      res.status(500).json({
        success: false,
        message: "PermissionedDomains setup failed",
        code: "DOMAINS_SETUP_ERROR",
      });
    }
  }

  /**
   * 게이트웨이 등록 API
   * POST /api/cashout/register-gateway
   */
  async registerGateway(req, res) {
    try {
      const gatewayInfo = req.body;
      const userId = req.user?.userId;

      // 게이트웨이 등록
      const result = this.cashoutService.registerApprovedGateway(gatewayInfo);

      // 보안 이벤트 로깅
      if (userId) {
        this.authService.logSecurityEvent(userId, "gateway_registered", {
          gatewayId: result.gatewayId,
          gatewayName: result.gateway.name,
          domain: result.gateway.domain,
        });
      }

      res.status(201).json({
        success: true,
        message: "Gateway registered successfully",
        data: result.gateway,
      });
    } catch (error) {
      console.error("❌ Gateway registration failed:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Gateway registration failed",
        code: "GATEWAY_REGISTRATION_ERROR",
      });
    }
  }

  /**
   * 허가된 게이트웨이 목록 조회 API
   * GET /api/cashout/gateways
   */
  async getApprovedGateways(req, res) {
    try {
      const gateways = this.cashoutService.getApprovedGateways();

      res.status(200).json({
        success: true,
        message: "Approved gateways retrieved successfully",
        data: {
          gateways,
          count: gateways.length,
        },
      });
    } catch (error) {
      console.error("❌ Gateway retrieval failed:", error);
      res.status(500).json({
        success: false,
        message: "Gateway retrieval failed",
        code: "GATEWAY_RETRIEVAL_ERROR",
      });
    }
  }

  /**
   * 현금화 요청 생성 API
   * POST /api/cashout/request
   */
  async createCashoutRequest(req, res) {
    try {
      const cashoutRequest = req.body;
      const userId = req.user?.userId;

      // 사용자 ID 자동 설정
      cashoutRequest.userId = userId;

      // 현금화 요청 생성
      const result = await this.cashoutService.createCashoutRequest(
        cashoutRequest
      );

      // 보안 이벤트 로깅
      if (userId) {
        this.authService.logSecurityEvent(userId, "cashout_request_created", {
          requestId: result.requestId,
          amount: result.request.amount,
          currency: result.request.currency,
          gatewayName: result.request.gateway.name,
        });
      }

      res.status(201).json({
        success: true,
        message: "Cashout request created successfully",
        data: result.request,
      });
    } catch (error) {
      console.error("❌ Cashout request creation failed:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Cashout request creation failed",
        code: "CASHOUT_REQUEST_ERROR",
      });
    }
  }

  /**
   * 현금화 요청 처리 API
   * POST /api/cashout/process/:requestId
   */
  async processCashoutRequest(req, res) {
    try {
      const { requestId } = req.params;
      const userId = req.user?.userId;

      if (!requestId) {
        return res.status(400).json({
          success: false,
          message: "Request ID is required",
          code: "MISSING_REQUEST_ID",
        });
      }

      // 현금화 요청 처리
      const result = await this.cashoutService.processCashoutRequest(requestId);

      // 보안 이벤트 로깅
      if (userId) {
        this.authService.logSecurityEvent(userId, "cashout_request_processed", {
          requestId,
          status: result.status,
          gatewayTransactionId: result.gatewayTransactionId,
        });
      }

      res.status(200).json({
        success: result.success,
        message: result.message || "Cashout request processed",
        data: {
          requestId: result.requestId,
          status: result.status,
          gatewayTransactionId: result.gatewayTransactionId,
          processedAt: result.processedAt,
        },
      });
    } catch (error) {
      console.error("❌ Cashout request processing failed:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Cashout request processing failed",
        code: "CASHOUT_PROCESSING_ERROR",
      });
    }
  }

  /**
   * 현금화 요청 상태 조회 API
   * GET /api/cashout/status/:requestId
   */
  async getCashoutRequestStatus(req, res) {
    try {
      const { requestId } = req.params;

      if (!requestId) {
        return res.status(400).json({
          success: false,
          message: "Request ID is required",
          code: "MISSING_REQUEST_ID",
        });
      }

      // 요청 상태 조회
      const status = this.cashoutService.getCashoutRequestStatus(requestId);

      res.status(200).json({
        success: true,
        message: "Cashout request status retrieved successfully",
        data: status,
      });
    } catch (error) {
      console.error("❌ Cashout status retrieval failed:", error);
      res.status(404).json({
        success: false,
        message: error.message || "Cashout status retrieval failed",
        code: "CASHOUT_STATUS_ERROR",
      });
    }
  }

  /**
   * 현금화 영수증 생성 API
   * POST /api/cashout/receipt/:requestId
   */
  async generateCashoutReceipt(req, res) {
    try {
      const { requestId } = req.params;
      const userId = req.user?.userId;

      if (!requestId) {
        return res.status(400).json({
          success: false,
          message: "Request ID is required",
          code: "MISSING_REQUEST_ID",
        });
      }

      // 영수증 생성
      const result = this.cashoutService.generateCashoutReceipt(requestId);

      // 보안 이벤트 로깅
      if (userId) {
        this.authService.logSecurityEvent(userId, "receipt_generated", {
          receiptId: result.receiptId,
          requestId,
        });
      }

      res.status(201).json({
        success: true,
        message: "Cashout receipt generated successfully",
        data: result.receipt,
      });
    } catch (error) {
      console.error("❌ Receipt generation failed:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Receipt generation failed",
        code: "RECEIPT_GENERATION_ERROR",
      });
    }
  }

  /**
   * 영수증 조회 API
   * GET /api/cashout/receipt/:receiptId
   */
  async getReceipt(req, res) {
    try {
      const { receiptId } = req.params;

      if (!receiptId) {
        return res.status(400).json({
          success: false,
          message: "Receipt ID is required",
          code: "MISSING_RECEIPT_ID",
        });
      }

      // 영수증 조회
      const receipt = this.cashoutService.getReceipt(receiptId);

      res.status(200).json({
        success: true,
        message: "Receipt retrieved successfully",
        data: receipt,
      });
    } catch (error) {
      console.error("❌ Receipt retrieval failed:", error);
      res.status(404).json({
        success: false,
        message: error.message || "Receipt retrieval failed",
        code: "RECEIPT_RETRIEVAL_ERROR",
      });
    }
  }

  /**
   * 은행 이체 처리 API
   * POST /api/cashout/bank-transfer
   */
  async processBankTransfer(req, res) {
    try {
      const bankTransfer = req.body;
      const userId = req.user?.userId;

      // 은행 이체 처리
      const result = await this.cashoutService.processBankTransfer(
        bankTransfer
      );

      // 보안 이벤트 로깅
      if (userId) {
        this.authService.logSecurityEvent(userId, "bank_transfer_processed", {
          requestId: bankTransfer.requestId,
          bankTransactionId: result.bankTransactionId,
          status: result.status,
        });
      }

      res.status(200).json({
        success: result.success,
        message: "Bank transfer processed successfully",
        data: {
          bankTransactionId: result.bankTransactionId,
          status: result.status,
          processedAt: result.processedAt,
          estimatedArrival: result.estimatedArrival,
        },
      });
    } catch (error) {
      console.error("❌ Bank transfer failed:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Bank transfer failed",
        code: "BANK_TRANSFER_ERROR",
      });
    }
  }

  /**
   * 모바일머니 이체 처리 API
   * POST /api/cashout/mobile-money
   */
  async processMobileMoneyTransfer(req, res) {
    try {
      const mobileMoneyTransfer = req.body;
      const userId = req.user?.userId;

      // 모바일머니 이체 처리
      const result = await this.cashoutService.processMobileMoneyTransfer(
        mobileMoneyTransfer
      );

      // 보안 이벤트 로깅
      if (userId) {
        this.authService.logSecurityEvent(
          userId,
          "mobile_money_transfer_processed",
          {
            requestId: mobileMoneyTransfer.requestId,
            provider: result.provider,
            transactionId: result.transactionId,
            status: result.status,
          }
        );
      }

      res.status(200).json({
        success: result.success,
        message: "Mobile money transfer processed successfully",
        data: {
          provider: result.provider,
          transactionId: result.transactionId,
          status: result.status,
          processedAt: result.processedAt,
          estimatedArrival: result.estimatedArrival,
        },
      });
    } catch (error) {
      console.error("❌ Mobile money transfer failed:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Mobile money transfer failed",
        code: "MOBILE_MONEY_ERROR",
      });
    }
  }
}

module.exports = CashoutController;
