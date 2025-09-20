const xrpl = require("xrpl");

/**
 * XRPL PermissionedDomains 레저 서비스
 * 참고: /Users/yelim/Projects/XRPL/xrpl/PermissionedDomains/
 * 현금화 게이트웨이 도메인 관리용
 */
class XRPLPermissionedDomainsService {
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
      console.log(
        "✅ XRPL PermissionedDomains Service connected to:",
        this.serverUrl
      );
    } catch (error) {
      console.error(
        "❌ XRPL PermissionedDomains Service connection failed:",
        error
      );
      throw error;
    }
  }

  async disconnect() {
    if (this.client && this.client.isConnected()) {
      await this.client.disconnect();
      console.log("✅ XRPL PermissionedDomains Service disconnected");
    }
  }

  /**
   * 16진수 인코딩 헬퍼 함수
   */
  toHex(str) {
    return Buffer.from(str, "utf8").toString("hex");
  }

  /**
   * 도메인 생성 (참고: createDomain.ts)
   * @param {string} adminSeed - 관리자 지갑 시드
   * @param {Array} acceptedCredentials - 허용된 자격증명 목록
   * @returns {Promise<Object>} 트랜잭션 결과 및 도메인 ID
   */
  async createDomain(adminSeed, acceptedCredentials = []) {
    await this.connect();

    try {
      const adminWallet = xrpl.Wallet.fromSeed(adminSeed.trim());

      // 기본 KYC 자격증명 추가
      const defaultCredentials = [
        {
          Credential: {
            Issuer: adminWallet.address,
            CredentialType: this.toHex("KYC"),
          },
        },
      ];

      const tx = {
        TransactionType: "PermissionedDomainSet",
        Account: adminWallet.address,
        // DomainID 생략 (새 도메인 생성)
        AcceptedCredentials:
          acceptedCredentials.length > 0
            ? acceptedCredentials
            : defaultCredentials,
      };

      const prepared = await this.client.autofill(tx);
      const signed = adminWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log("✅ PermissionedDomain created:", {
        hash: result.result.hash,
        admin: adminWallet.address,
      });

      // 생성된 도메인 ID 추출
      const out = result.result || result;
      const created = (out.meta?.AffectedNodes || []).find(
        (n) => n.CreatedNode?.LedgerEntryType === "PermissionedDomain"
      );

      const domainId =
        created?.CreatedNode?.LedgerIndex ||
        created?.CreatedNode?.NewFields?.DomainID ||
        null;

      if (domainId) {
        console.log("🆔 Created DomainID:", domainId);
      }

      return {
        success: true,
        hash: result.result.hash,
        adminAddress: adminWallet.address,
        domainId,
        acceptedCredentials:
          acceptedCredentials.length > 0
            ? acceptedCredentials
            : defaultCredentials,
        result: result.result,
      };
    } catch (error) {
      console.error("❌ PermissionedDomain creation failed:", error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  /**
   * 도메인 삭제 (참고: deleteDomain.ts)
   * @param {string} adminSeed - 관리자 지갑 시드
   * @param {string} domainId - 삭제할 도메인 ID
   * @returns {Promise<Object>} 트랜잭션 결과
   */
  async deleteDomain(adminSeed, domainId) {
    await this.connect();

    try {
      const adminWallet = xrpl.Wallet.fromSeed(adminSeed.trim());

      const tx = {
        TransactionType: "PermissionedDomainDelete",
        Account: adminWallet.address,
        DomainID: domainId,
      };

      const prepared = await this.client.autofill(tx);
      const signed = adminWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log("✅ PermissionedDomain deleted:", {
        hash: result.result.hash,
        admin: adminWallet.address,
        domainId: domainId,
      });

      return {
        success: true,
        hash: result.result.hash,
        adminAddress: adminWallet.address,
        domainId,
        result: result.result,
      };
    } catch (error) {
      console.error("❌ PermissionedDomain deletion failed:", error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  /**
   * 현금화 게이트웨이 도메인 생성 (그룹 모임통장용)
   * @param {string} adminSeed - 관리자 시드
   * @param {Array} allowedGateways - 허용된 게이트웨이 주소 목록
   * @returns {Promise<Object>} 생성 결과
   */
  async createCashoutGatewayDomain(adminSeed, allowedGateways = []) {
    const acceptedCredentials = allowedGateways.map((gateway) => ({
      Credential: {
        Issuer: gateway.address,
        CredentialType: this.toHex("GATEWAY_AUTH"),
      },
    }));

    // 기본 KYC도 추가
    acceptedCredentials.push({
      Credential: {
        Issuer: xrpl.Wallet.fromSeed(adminSeed.trim()).address,
        CredentialType: this.toHex("KYC"),
      },
    });

    const result = await this.createDomain(adminSeed, acceptedCredentials);

    console.log(
      "✅ Cashout gateway domain created with",
      allowedGateways.length,
      "allowed gateways"
    );

    return {
      ...result,
      allowedGateways,
      gatewayCount: allowedGateways.length,
    };
  }

  /**
   * 도메인 정보 조회
   * @param {string} domainId - 도메인 ID
   * @returns {Promise<Object>} 도메인 정보
   */
  async getDomainInfo(domainId) {
    await this.connect();

    try {
      const response = await this.client.request({
        command: "ledger_entry",
        ledger_index: "validated",
        index: domainId,
      });

      console.log("📋 Domain info retrieved for:", domainId);

      return {
        success: true,
        domainId,
        domainInfo: response.result.node,
        acceptedCredentials: response.result.node?.AcceptedCredentials || [],
      };
    } catch (error) {
      console.error("❌ Domain info retrieval failed:", error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

module.exports = XRPLPermissionedDomainsService;
