const xrpl = require("xrpl");

/**
 * XRPL Payment 레저 서비스
 * 참고: /Users/yelim/Projects/XRPL/xrpl/Payment/
 */
class XRPLPaymentService {
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
      console.log("✅ XRPL Payment Service connected to:", this.serverUrl);
    } catch (error) {
      console.error("❌ XRPL Payment Service connection failed:", error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client && this.client.isConnected()) {
      await this.client.disconnect();
      console.log("✅ XRPL Payment Service disconnected");
    }
  }

  /**
   * XRP 전송 (참고: sendXRP.ts)
   * @param {string} senderSeed - 발신자 시드
   * @param {string} destinationAddress - 수신자 주소
   * @param {string} amount - XRP 금액 (drops 단위)
   * @param {string} memo - 메모 (선택사항)
   * @returns {Promise<Object>} 트랜잭션 결과
   */
  async sendXRP(senderSeed, destinationAddress, amount, memo = null) {
    await this.connect();

    try {
      const senderWallet = xrpl.Wallet.fromSeed(senderSeed.trim());

      const tx = {
        TransactionType: "Payment",
        Account: senderWallet.address,
        Destination: destinationAddress,
        Amount: amount, // XRP는 drops 단위로
      };

      // 메모 추가 (선택사항)
      if (memo) {
        tx.Memos = [
          {
            Memo: {
              MemoData: Buffer.from(memo, "utf8").toString("hex"),
              MemoType: Buffer.from("text/plain", "utf8").toString("hex"),
            },
          },
        ];
      }

      const prepared = await this.client.autofill(tx);
      const signed = senderWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log("✅ XRP sent:", {
        hash: result.result.hash,
        from: senderWallet.address,
        to: destinationAddress,
        amount: amount,
        memo: memo,
      });

      return {
        success: true,
        hash: result.result.hash,
        fromAddress: senderWallet.address,
        toAddress: destinationAddress,
        amount,
        memo,
        result: result.result,
      };
    } catch (error) {
      console.error("❌ XRP payment failed:", error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  /**
   * IOU 토큰 전송 (참고: sendIOU.ts)
   * @param {string} senderSeed - 발신자 시드
   * @param {string} destinationAddress - 수신자 주소
   * @param {Object} amount - IOU 금액 객체 {currency, issuer, value}
   * @param {string} memo - 메모
   * @returns {Promise<Object>} 트랜잭션 결과
   */
  async sendIOU(senderSeed, destinationAddress, amount, memo = null) {
    await this.connect();

    try {
      const senderWallet = xrpl.Wallet.fromSeed(senderSeed.trim());

      const tx = {
        TransactionType: "Payment",
        Account: senderWallet.address,
        Destination: destinationAddress,
        Amount: {
          currency: amount.currency,
          issuer: amount.issuer,
          value: amount.value,
        },
      };

      // 메모 추가
      if (memo) {
        tx.Memos = [
          {
            Memo: {
              MemoData: Buffer.from(memo, "utf8").toString("hex"),
              MemoType: Buffer.from("text/plain", "utf8").toString("hex"),
            },
          },
        ];
      }

      const prepared = await this.client.autofill(tx);
      const signed = senderWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log("✅ IOU sent:", {
        hash: result.result.hash,
        from: senderWallet.address,
        to: destinationAddress,
        amount: amount,
        memo: memo,
      });

      return {
        success: true,
        hash: result.result.hash,
        fromAddress: senderWallet.address,
        toAddress: destinationAddress,
        amount,
        memo,
        result: result.result,
      };
    } catch (error) {
      console.error("❌ IOU payment failed:", error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  /**
   * 그룹 내 자동 분배 (여러 명에게 동시 송금)
   * @param {string} senderSeed - 발신자 시드
   * @param {Array} recipients - 수신자 배열 [{address, amount, memo}]
   * @param {string} currency - 통화 (XRP 또는 IOU)
   * @returns {Promise<Array>} 모든 송금 결과
   */
  async distributeFunds(senderSeed, recipients, currency = "XRP") {
    const results = [];

    for (const recipient of recipients) {
      try {
        let result;
        if (currency === "XRP") {
          result = await this.sendXRP(
            senderSeed,
            recipient.address,
            recipient.amount,
            recipient.memo
          );
        } else {
          result = await this.sendIOU(
            senderSeed,
            recipient.address,
            recipient.amount,
            recipient.memo
          );
        }

        results.push({
          recipientAddress: recipient.address,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          recipientAddress: recipient.address,
          success: false,
          error: error.message,
        });
      }
    }

    console.log(
      "✅ Fund distribution completed:",
      results.length,
      "recipients processed"
    );
    return results;
  }
}

module.exports = XRPLPaymentService;
