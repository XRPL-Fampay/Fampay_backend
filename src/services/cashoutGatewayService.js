const xrpl = require("xrpl");
const crypto = require("crypto-js");

/**
 * 현금화 게이트웨이 서비스
 * 개발자 2 담당 - PermissionedDomains 기반 안전 출금
 */
class CashoutGatewayService {
  constructor() {
    this.client = null;
    this.serverUrl =
      process.env.XRPL_SERVER || "wss://s.devnet.rippletest.net:51233";
    // 허가된 게이트웨이 목록 (실제로는 DB에서 관리)
    this.approvedGateways = new Map();
    // 현금화 요청 기록
    this.cashoutRequests = new Map();
    // 영수증 저장소
    this.receipts = new Map();
  }

  async connect() {
    if (this.client && this.client.isConnected()) {
      return;
    }

    try {
      this.client = new xrpl.Client(this.serverUrl);
      await this.client.connect();
      console.log("✅ Cashout Gateway Service connected to:", this.serverUrl);
    } catch (error) {
      console.error("❌ Cashout Gateway Service connection failed:", error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client && this.client.isConnected()) {
      await this.client.disconnect();
      console.log("✅ Cashout Gateway Service disconnected");
    }
  }

  /**
   * PermissionedDomains 설정 (XRPL 레저 기반)
   * @param {string} adminSeed - 관리자 지갑 시드
   * @param {Array} allowedDomains - 허용할 도메인 목록
   * @returns {Object} 도메인 설정 결과
   */
  async setupPermissionedDomains(adminSeed, allowedDomains = []) {
    await this.connect();

    try {
      const adminWallet = xrpl.Wallet.fromSeed(adminSeed);

      // PermissionedDomains 트랜잭션 생성
      const domainEntries = allowedDomains.map((domain) => ({
        Domain: Buffer.from(domain, "utf8").toString("hex").toUpperCase(),
      }));

      const tx = {
        TransactionType: "DIDSet",
        Account: adminWallet.address,
        DIDDocument: Buffer.from(
          JSON.stringify({
            permissionedDomains: allowedDomains,
            gatewayType: "cashout",
            version: "1.0",
            createdAt: new Date().toISOString(),
          }),
          "utf8"
        )
          .toString("hex")
          .toUpperCase(),
      };

      const prepared = await this.client.autofill(tx);
      const signed = adminWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log("✅ PermissionedDomains setup completed:", {
        hash: result.result.hash,
        account: adminWallet.address,
        domains: allowedDomains.length,
      });

      return {
        success: true,
        hash: result.result.hash,
        account: adminWallet.address,
        permissionedDomains: allowedDomains,
        setupAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ PermissionedDomains setup failed:", error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  /**
   * 허가된 게이트웨이 등록
   * @param {Object} gatewayInfo - 게이트웨이 정보
   * @returns {Object} 등록 결과
   */
  registerApprovedGateway(gatewayInfo) {
    try {
      const {
        gatewayId,
        name,
        domain,
        apiEndpoint,
        supportedCurrencies,
        country,
        licenseNumber,
        contactInfo,
      } = gatewayInfo;

      if (!gatewayId || !name || !domain || !apiEndpoint) {
        throw new Error("Missing required gateway information");
      }

      const gateway = {
        gatewayId,
        name,
        domain,
        apiEndpoint,
        supportedCurrencies: supportedCurrencies || ["USD", "EUR", "KRW"],
        country: country || "US",
        licenseNumber,
        contactInfo,
        status: "active",
        registeredAt: new Date().toISOString(),
        lastVerified: new Date().toISOString(),
        trustScore: 100,
      };

      this.approvedGateways.set(gatewayId, gateway);

      console.log("✅ Gateway registered:", {
        gatewayId,
        name,
        domain,
        supportedCurrencies: gateway.supportedCurrencies,
      });

      return {
        success: true,
        gatewayId,
        gateway: {
          gatewayId: gateway.gatewayId,
          name: gateway.name,
          domain: gateway.domain,
          supportedCurrencies: gateway.supportedCurrencies,
          country: gateway.country,
          status: gateway.status,
          registeredAt: gateway.registeredAt,
        },
      };
    } catch (error) {
      console.error("❌ Gateway registration failed:", error);
      throw error;
    }
  }

  /**
   * 현금화 요청 생성
   * @param {Object} cashoutRequest - 현금화 요청 정보
   * @returns {Object} 요청 결과
   */
  async createCashoutRequest(cashoutRequest) {
    try {
      const {
        userId,
        walletAddress,
        amount,
        currency,
        gatewayId,
        destinationAccount,
        memo,
      } = cashoutRequest;

      // 입력 검증
      if (!userId || !walletAddress || !amount || !currency || !gatewayId) {
        throw new Error("Missing required cashout information");
      }

      // 게이트웨이 검증
      const gateway = this.approvedGateways.get(gatewayId);
      if (!gateway) {
        throw new Error("Gateway not approved or not found");
      }

      if (!gateway.supportedCurrencies.includes(currency)) {
        throw new Error(`Currency ${currency} not supported by gateway`);
      }

      // 요청 ID 생성
      const requestId = crypto.lib.WordArray.random(16).toString();

      const request = {
        requestId,
        userId,
        walletAddress,
        amount: parseFloat(amount),
        currency,
        gatewayId,
        gateway: {
          name: gateway.name,
          domain: gateway.domain,
        },
        destinationAccount,
        memo: memo || "",
        status: "pending",
        createdAt: new Date().toISOString(),
        estimatedProcessingTime: "1-3 business days",
        fees: {
          gatewayFee: parseFloat(amount) * 0.01, // 1% 게이트웨이 수수료
          networkFee: 0.1, // 네트워크 수수료
        },
      };

      this.cashoutRequests.set(requestId, request);

      console.log("✅ Cashout request created:", {
        requestId,
        userId,
        amount: request.amount,
        currency,
        gatewayName: gateway.name,
      });

      return {
        success: true,
        requestId,
        request: {
          requestId: request.requestId,
          amount: request.amount,
          currency: request.currency,
          gateway: request.gateway,
          status: request.status,
          createdAt: request.createdAt,
          estimatedProcessingTime: request.estimatedProcessingTime,
          fees: request.fees,
        },
      };
    } catch (error) {
      console.error("❌ Cashout request creation failed:", error);
      throw error;
    }
  }

  /**
   * 현금화 요청 처리 (게이트웨이 API 연동 시뮬레이션)
   * @param {string} requestId - 요청 ID
   * @returns {Object} 처리 결과
   */
  async processCashoutRequest(requestId) {
    try {
      const request = this.cashoutRequests.get(requestId);
      if (!request) {
        throw new Error("Cashout request not found");
      }

      if (request.status !== "pending") {
        throw new Error(`Request already ${request.status}`);
      }

      const gateway = this.approvedGateways.get(request.gatewayId);

      // 게이트웨이 API 호출 시뮬레이션
      const gatewayResponse = await this.simulateGatewayAPICall(
        request,
        gateway
      );

      // 요청 상태 업데이트
      request.status = gatewayResponse.success ? "processing" : "failed";
      request.processedAt = new Date().toISOString();
      request.gatewayTransactionId = gatewayResponse.transactionId;
      request.gatewayResponse = gatewayResponse;

      this.cashoutRequests.set(requestId, request);

      console.log("✅ Cashout request processed:", {
        requestId,
        status: request.status,
        gatewayTransactionId: request.gatewayTransactionId,
      });

      return {
        success: gatewayResponse.success,
        requestId,
        status: request.status,
        gatewayTransactionId: request.gatewayTransactionId,
        processedAt: request.processedAt,
        message: gatewayResponse.message,
      };
    } catch (error) {
      console.error("❌ Cashout request processing failed:", error);
      throw error;
    }
  }

  /**
   * 게이트웨이 API 호출 시뮬레이션
   * @param {Object} request - 현금화 요청
   * @param {Object} gateway - 게이트웨이 정보
   * @returns {Object} API 응답 시뮬레이션
   */
  async simulateGatewayAPICall(request, gateway) {
    // 실제 구현에서는 실제 게이트웨이 API 호출
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% 성공률
        resolve({
          success,
          transactionId: success
            ? `GW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            : null,
          message: success
            ? "Transaction initiated successfully"
            : "Gateway processing failed",
          estimatedCompletion: success
            ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            : null,
        });
      }, 1000); // 1초 지연 시뮬레이션
    });
  }

  /**
   * 현금화 영수증 생성
   * @param {string} requestId - 요청 ID
   * @returns {Object} 영수증 정보
   */
  generateCashoutReceipt(requestId) {
    try {
      const request = this.cashoutRequests.get(requestId);
      if (!request) {
        throw new Error("Cashout request not found");
      }

      const receiptId = crypto.lib.WordArray.random(12).toString();
      const receipt = {
        receiptId,
        requestId,
        userId: request.userId,
        transaction: {
          amount: request.amount,
          currency: request.currency,
          fromWallet: request.walletAddress,
          toAccount: request.destinationAccount,
          gateway: request.gateway,
        },
        fees: request.fees,
        status: request.status,
        timestamps: {
          requested: request.createdAt,
          processed: request.processedAt,
          receiptGenerated: new Date().toISOString(),
        },
        gatewayTransactionId: request.gatewayTransactionId,
        receiptHash: crypto
          .SHA256(
            JSON.stringify({
              receiptId,
              requestId,
              amount: request.amount,
              timestamp: new Date().toISOString(),
            })
          )
          .toString(),
        version: "1.0",
      };

      this.receipts.set(receiptId, receipt);

      console.log("✅ Cashout receipt generated:", {
        receiptId,
        requestId,
        amount: receipt.transaction.amount,
        currency: receipt.transaction.currency,
      });

      return {
        success: true,
        receiptId,
        receipt: {
          receiptId: receipt.receiptId,
          transaction: receipt.transaction,
          fees: receipt.fees,
          status: receipt.status,
          timestamps: receipt.timestamps,
          receiptHash: receipt.receiptHash,
        },
      };
    } catch (error) {
      console.error("❌ Receipt generation failed:", error);
      throw error;
    }
  }

  /**
   * 은행 API 연동 (시뮬레이션)
   * @param {Object} bankTransfer - 은행 이체 정보
   * @returns {Object} 은행 이체 결과
   */
  async processBankTransfer(bankTransfer) {
    try {
      const {
        requestId,
        bankCode,
        accountNumber,
        accountHolderName,
        amount,
        currency,
        memo,
      } = bankTransfer;

      // 은행 API 호출 시뮬레이션
      const bankResponse = await this.simulateBankAPI(bankTransfer);

      console.log("✅ Bank transfer processed:", {
        requestId,
        bankTransactionId: bankResponse.transactionId,
        status: bankResponse.status,
      });

      return {
        success: bankResponse.success,
        bankTransactionId: bankResponse.transactionId,
        status: bankResponse.status,
        processedAt: new Date().toISOString(),
        estimatedArrival: bankResponse.estimatedArrival,
      };
    } catch (error) {
      console.error("❌ Bank transfer failed:", error);
      throw error;
    }
  }

  /**
   * 은행 API 호출 시뮬레이션
   * @param {Object} bankTransfer - 은행 이체 정보
   * @returns {Object} 은행 API 응답
   */
  async simulateBankAPI(bankTransfer) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.05; // 95% 성공률
        resolve({
          success,
          transactionId: success
            ? `BANK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            : null,
          status: success ? "completed" : "failed",
          estimatedArrival: success
            ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
            : null, // 2시간 후
          message: success
            ? "Bank transfer completed successfully"
            : "Bank transfer failed",
        });
      }, 2000); // 2초 지연 시뮬레이션
    });
  }

  /**
   * 모바일머니 API 연동 (시뮬레이션)
   * @param {Object} mobileMoneyTransfer - 모바일머니 이체 정보
   * @returns {Object} 모바일머니 이체 결과
   */
  async processMobileMoneyTransfer(mobileMoneyTransfer) {
    try {
      const {
        requestId,
        provider, // M-Pesa, MTN, Airtel 등
        phoneNumber,
        amount,
        currency,
        memo,
      } = mobileMoneyTransfer;

      // 모바일머니 API 호출 시뮬레이션
      const mmResponse = await this.simulateMobileMoneyAPI(mobileMoneyTransfer);

      console.log("✅ Mobile money transfer processed:", {
        requestId,
        provider,
        transactionId: mmResponse.transactionId,
        status: mmResponse.status,
      });

      return {
        success: mmResponse.success,
        provider,
        transactionId: mmResponse.transactionId,
        status: mmResponse.status,
        processedAt: new Date().toISOString(),
        estimatedArrival: mmResponse.estimatedArrival,
      };
    } catch (error) {
      console.error("❌ Mobile money transfer failed:", error);
      throw error;
    }
  }

  /**
   * 모바일머니 API 호출 시뮬레이션
   * @param {Object} mobileMoneyTransfer - 모바일머니 이체 정보
   * @returns {Object} 모바일머니 API 응답
   */
  async simulateMobileMoneyAPI(mobileMoneyTransfer) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.08; // 92% 성공률
        resolve({
          success,
          transactionId: success
            ? `MM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            : null,
          status: success ? "completed" : "failed",
          estimatedArrival: success
            ? new Date(Date.now() + 30 * 60 * 1000).toISOString()
            : null, // 30분 후
          message: success
            ? "Mobile money transfer completed"
            : "Mobile money transfer failed",
        });
      }, 1500); // 1.5초 지연 시뮬레이션
    });
  }

  /**
   * 허가된 게이트웨이 목록 조회
   * @returns {Array} 게이트웨이 목록
   */
  getApprovedGateways() {
    return Array.from(this.approvedGateways.values()).map((gateway) => ({
      gatewayId: gateway.gatewayId,
      name: gateway.name,
      domain: gateway.domain,
      supportedCurrencies: gateway.supportedCurrencies,
      country: gateway.country,
      status: gateway.status,
      trustScore: gateway.trustScore,
    }));
  }

  /**
   * 현금화 요청 상태 조회
   * @param {string} requestId - 요청 ID
   * @returns {Object} 요청 상태
   */
  getCashoutRequestStatus(requestId) {
    const request = this.cashoutRequests.get(requestId);
    if (!request) {
      throw new Error("Cashout request not found");
    }

    return {
      requestId: request.requestId,
      status: request.status,
      amount: request.amount,
      currency: request.currency,
      gateway: request.gateway,
      createdAt: request.createdAt,
      processedAt: request.processedAt,
      gatewayTransactionId: request.gatewayTransactionId,
    };
  }

  /**
   * 영수증 조회
   * @param {string} receiptId - 영수증 ID
   * @returns {Object} 영수증 정보
   */
  getReceipt(receiptId) {
    const receipt = this.receipts.get(receiptId);
    if (!receipt) {
      throw new Error("Receipt not found");
    }

    return receipt;
  }
}

module.exports = CashoutGatewayService;
