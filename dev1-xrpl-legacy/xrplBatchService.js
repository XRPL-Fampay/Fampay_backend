const xrpl = require("xrpl");

/**
 * XRPL Batch 레저 서비스
 * 참고: /Users/yelim/Projects/XRPL/xrpl/Batch/
 * 다중 트랜잭션을 하나의 Batch로 처리
 */
class XRPLBatchService {
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
      console.log("✅ XRPL Batch Service connected to:", this.serverUrl);
    } catch (error) {
      console.error("❌ XRPL Batch Service connection failed:", error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client && this.client.isConnected()) {
      await this.client.disconnect();
      console.log("✅ XRPL Batch Service disconnected");
    }
  }

  /**
   * AllOrNothing Batch 실행 (참고: AllOrNothing.ts)
   * 모든 트랜잭션이 성공하거나 모두 실패
   * @param {string} senderSeed - 발신자 지갑 시드
   * @param {Array} transactions - 실행할 트랜잭션 배열
   * @returns {Promise<Object>} Batch 트랜잭션 결과
   */
  async executeAllOrNothingBatch(senderSeed, transactions) {
    await this.connect();

    try {
      const senderWallet = xrpl.Wallet.fromSeed(senderSeed.trim());

      // 현재 시퀀스 번호 조회
      const accountInfo = await this.client.request({
        command: "account_info",
        account: senderWallet.address,
      });
      const baseSequence = accountInfo.result.account_data.Sequence;

      // RawTransactions 배열 생성
      const rawTransactions = transactions.map((tx, index) => ({
        RawTransaction: {
          ...tx,
          TransactionType: tx.TransactionType || "Payment",
          Flags: 0x40000000, // tfInnerBatchTxn (inner 트랜잭션 필수 플래그)
          Account: senderWallet.address,
          Sequence: baseSequence + index + 1, // 각 inner 트랜잭션마다 고유 시퀀스
          Fee: "0", // inner 트랜잭션은 fee 0
          SigningPubKey: "",
        },
      }));

      const batchTx = {
        TransactionType: "Batch",
        Account: senderWallet.address,
        Flags: 0x00010000, // AllOrNothing 플래그
        RawTransactions: rawTransactions,
        Sequence: baseSequence,
      };

      const prepared = await this.client.autofill(batchTx);
      const signed = senderWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log("✅ AllOrNothing Batch executed:", {
        hash: result.result.hash,
        sender: senderWallet.address,
        transactionCount: transactions.length,
      });

      return {
        success: true,
        hash: result.result.hash,
        senderAddress: senderWallet.address,
        transactionCount: transactions.length,
        batchType: "AllOrNothing",
        result: result.result,
      };
    } catch (error) {
      console.error("❌ AllOrNothing Batch execution failed:", error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  /**
   * 그룹 회비 일괄 수납 (AllOrNothing 방식)
   * @param {string} adminSeed - 그룹 관리자 시드
   * @param {Array} members - 회원 목록 [{address, amount, memo}]
   * @param {string} currency - 통화 종류
   * @returns {Promise<Object>} Batch 실행 결과
   */
  async collectGroupFees(adminSeed, members, currency = "XRP") {
    const adminWallet = xrpl.Wallet.fromSeed(adminSeed.trim());

    // 각 회원으로부터 회비 수납하는 트랜잭션들 생성
    const feeTransactions = members.map((member) => {
      const tx = {
        TransactionType: "Payment",
        Destination: adminWallet.address, // 그룹 지갑으로 수납
        Memo: member.memo || "Monthly group fee",
      };

      if (currency === "XRP") {
        tx.Amount = member.amount; // XRP는 drops 단위
      } else {
        tx.Amount = {
          currency: currency,
          issuer: member.issuer,
          value: member.amount,
        };
      }

      return tx;
    });

    const result = await this.executeAllOrNothingBatch(
      adminSeed,
      feeTransactions
    );

    console.log("✅ Group fees collected from", members.length, "members");

    return {
      ...result,
      memberCount: members.length,
      currency,
      totalAmount: members.reduce(
        (sum, member) => sum + parseFloat(member.amount),
        0
      ),
    };
  }

  /**
   * 그룹 지출 일괄 분배
   * @param {string} adminSeed - 그룹 관리자 시드
   * @param {Array} expenses - 지출 목록 [{recipientAddress, amount, memo}]
   * @param {string} currency - 통화 종류
   * @returns {Promise<Object>} Batch 실행 결과
   */
  async distributeGroupExpenses(adminSeed, expenses, currency = "XRP") {
    const adminWallet = xrpl.Wallet.fromSeed(adminSeed.trim());

    // 각 지출처로 송금하는 트랜잭션들 생성
    const expenseTransactions = expenses.map((expense) => {
      const tx = {
        TransactionType: "Payment",
        Destination: expense.recipientAddress,
        Memo: expense.memo || "Group expense payment",
      };

      if (currency === "XRP") {
        tx.Amount = expense.amount;
      } else {
        tx.Amount = {
          currency: currency,
          issuer: expense.issuer,
          value: expense.amount,
        };
      }

      return tx;
    });

    const result = await this.executeAllOrNothingBatch(
      adminSeed,
      expenseTransactions
    );

    console.log(
      "✅ Group expenses distributed to",
      expenses.length,
      "recipients"
    );

    return {
      ...result,
      expenseCount: expenses.length,
      currency,
      totalAmount: expenses.reduce(
        (sum, expense) => sum + parseFloat(expense.amount),
        0
      ),
    };
  }

  /**
   * Independent Batch 실행 (각 트랜잭션 독립적으로 처리)
   * @param {string} senderSeed - 발신자 지갑 시드
   * @param {Array} transactions - 실행할 트랜잭션 배열
   * @returns {Promise<Object>} Batch 트랜잭션 결과
   */
  async executeIndependentBatch(senderSeed, transactions) {
    await this.connect();

    try {
      const senderWallet = xrpl.Wallet.fromSeed(senderSeed.trim());

      const accountInfo = await this.client.request({
        command: "account_info",
        account: senderWallet.address,
      });
      const baseSequence = accountInfo.result.account_data.Sequence;

      const rawTransactions = transactions.map((tx, index) => ({
        RawTransaction: {
          ...tx,
          TransactionType: tx.TransactionType || "Payment",
          Flags: 0x40000000,
          Account: senderWallet.address,
          Sequence: baseSequence + index + 1,
          Fee: "0",
          SigningPubKey: "",
        },
      }));

      const batchTx = {
        TransactionType: "Batch",
        Account: senderWallet.address,
        Flags: 0x00020000, // Independent 플래그
        RawTransactions: rawTransactions,
        Sequence: baseSequence,
      };

      const prepared = await this.client.autofill(batchTx);
      const signed = senderWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log("✅ Independent Batch executed:", {
        hash: result.result.hash,
        sender: senderWallet.address,
        transactionCount: transactions.length,
      });

      return {
        success: true,
        hash: result.result.hash,
        senderAddress: senderWallet.address,
        transactionCount: transactions.length,
        batchType: "Independent",
        result: result.result,
      };
    } catch (error) {
      console.error("❌ Independent Batch execution failed:", error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

module.exports = XRPLBatchService;
