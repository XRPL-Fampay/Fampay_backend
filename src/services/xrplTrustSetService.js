const xrpl = require("xrpl");

/**
 * XRPL TrustSet 레저 서비스 (개선된 버전)
 * 참고: /Users/yelim/Projects/XRPL/xrpl/TrustSet/
 */
class XRPLTrustSetService {
  constructor() {
    this.client = null;
    // devnet 사용 (참고 코드와 동일)
    this.serverUrl =
      process.env.XRPL_SERVER || "wss://s.devnet.rippletest.net:51233";
  }

  /**
   * XRPL 클라이언트 연결
   */
  async connect() {
    if (this.client && this.client.isConnected()) {
      return; // 이미 연결됨
    }

    try {
      this.client = new xrpl.Client(this.serverUrl);
      await this.client.connect();
      console.log("✅ XRPL TrustSet Service connected to:", this.serverUrl);
    } catch (error) {
      console.error("❌ XRPL TrustSet Service connection failed:", error);
      throw error;
    }
  }

  /**
   * XRPL 클라이언트 연결 해제 (try-finally 패턴)
   */
  async disconnect() {
    if (this.client && this.client.isConnected()) {
      await this.client.disconnect();
      console.log("✅ XRPL TrustSet Service disconnected");
    }
  }

  /**
   * TrustLine 생성 (참고: TrustSet.ts)
   * @param {string} userSeed - 사용자 지갑 시드
   * @param {string} issuerAddress - 발행자 주소
   * @param {string} currencyCode - 통화 코드
   * @param {string} limit - 신뢰 한도
   * @returns {Promise<Object>} 트랜잭션 결과
   */
  async createTrustLine(userSeed, issuerAddress, currencyCode, limit) {
    await this.connect();

    try {
      const userWallet = xrpl.Wallet.fromSeed(userSeed.trim());

      const tx = {
        TransactionType: "TrustSet",
        Account: userWallet.address,
        LimitAmount: {
          currency: currencyCode,
          issuer: issuerAddress,
          value: limit,
        },
        Flags: xrpl.TrustSetFlags.tfSetNoRipple, // NoRipple 플래그
      };

      const prepared = await this.client.autofill(tx);
      const signed = userWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log("✅ TrustLine created:", {
        hash: result.result.hash,
        user: userWallet.address,
        issuer: issuerAddress,
        currency: currencyCode,
        limit: limit,
      });

      return {
        success: true,
        hash: result.result.hash,
        userAddress: userWallet.address,
        issuerAddress,
        currencyCode,
        limit,
        result: result.result,
      };
    } catch (error) {
      console.error("❌ TrustLine creation failed:", error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  /**
   * TrustLine 승인 (참고: authorizeTrustLine.ts)
   * 발행자가 사용자의 TrustLine을 승인
   * @param {string} issuerSeed - 발행자 지갑 시드
   * @param {string} userAddress - 사용자 주소
   * @param {string} currencyCode - 통화 코드
   * @returns {Promise<Object>} 트랜잭션 결과
   */
  async authorizeTrustLine(issuerSeed, userAddress, currencyCode) {
    await this.connect();

    try {
      const issuerWallet = xrpl.Wallet.fromSeed(issuerSeed.trim());

      const tx = {
        TransactionType: "TrustSet",
        Account: issuerWallet.address, // 발행자가 승인
        LimitAmount: {
          currency: currencyCode,
          issuer: userAddress,
          value: "0",
        },
        Flags: 0x00010000, // tfSetAuth = 승인 플래그
      };

      const prepared = await this.client.autofill(tx);
      const signed = issuerWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log("✅ TrustLine authorized:", {
        hash: result.result.hash,
        issuer: issuerWallet.address,
        user: userAddress,
        currency: currencyCode,
      });

      return {
        success: true,
        hash: result.result.hash,
        issuerAddress: issuerWallet.address,
        userAddress,
        currencyCode,
        result: result.result,
      };
    } catch (error) {
      console.error("❌ TrustLine authorization failed:", error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  /**
   * RequireAuth 상태 확인
   */
  async checkRequireAuth(issuerAddress) {
    await this.connect();

    try {
      const accountInfo = await this.client.request({
        command: "account_info",
        account: issuerAddress,
        ledger_index: "validated",
      });

      const flags = accountInfo.result.account_data.Flags || 0;
      const requireAuth =
        (flags & xrpl.AccountSetAsfFlags.asfRequireAuth) !== 0;

      console.log("📋 RequireAuth status for", issuerAddress, ":", requireAuth);
      return requireAuth;
    } catch (error) {
      console.error("❌ RequireAuth check failed:", error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  /**
   * TrustLines 조회
   */
  async getTrustLines(userAddress) {
    await this.connect();

    try {
      const response = await this.client.request({
        command: "account_lines",
        account: userAddress,
        ledger_index: "validated",
      });

      const trustLines = response.result.lines.map((line) => ({
        currency: line.currency,
        issuer: line.account,
        balance: line.balance,
        limit: line.limit,
        limitPeer: line.limit_peer,
        authorized: line.authorized || false,
        peerAuthorized: line.peer_authorized || false,
        noRipple: line.no_ripple || false,
      }));

      console.log("📋 TrustLines for", userAddress, ":", trustLines.length);
      return trustLines;
    } catch (error) {
      console.error("❌ TrustLines retrieval failed:", error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  /**
   * 그룹 신뢰 관계 구축 (개선된 버전)
   */
  async establishGroupTrust(
    groupMembers,
    groupTokenIssuer,
    groupTokenCode,
    trustLimit
  ) {
    const results = [];

    for (const member of groupMembers) {
      try {
        const result = await this.createTrustLine(
          member.seed,
          groupTokenIssuer,
          groupTokenCode,
          trustLimit
        );
        results.push({
          memberAddress: member.address,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          memberAddress: member.address,
          success: false,
          error: error.message,
        });
      }
    }

    console.log(
      "✅ Group trust establishment completed:",
      results.length,
      "members processed"
    );
    return results;
  }

  /**
   * TrustLine 제거
   */
  async removeTrustLine(userSeed, issuerAddress, currencyCode) {
    await this.connect();

    try {
      const userWallet = xrpl.Wallet.fromSeed(userSeed.trim());

      const tx = {
        TransactionType: "TrustSet",
        Account: userWallet.address,
        LimitAmount: {
          currency: currencyCode,
          issuer: issuerAddress,
          value: "0", // 한도를 0으로 설정하여 제거
        },
      };

      const prepared = await this.client.autofill(tx);
      const signed = userWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log("✅ TrustLine removed:", {
        hash: result.result.hash,
        user: userWallet.address,
        issuer: issuerAddress,
        currency: currencyCode,
      });

      return {
        success: true,
        hash: result.result.hash,
        userAddress: userWallet.address,
        issuerAddress,
        currencyCode,
        result: result.result,
      };
    } catch (error) {
      console.error("❌ TrustLine removal failed:", error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

module.exports = XRPLTrustSetService;
