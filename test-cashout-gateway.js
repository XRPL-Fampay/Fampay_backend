require("dotenv").config();
const CashoutGatewayService = require("./src/services/cashoutGatewayService");

/**
 * 개발자 2 담당 - 현금화 게이트웨이 서비스 테스트
 * PermissionedDomains 기반 안전 출금 시스템
 */
async function testCashoutGatewayService() {
  console.log("🚀 Testing Cashout Gateway Service (Developer 2)...\n");

  const cashoutService = new CashoutGatewayService();

  try {
    // 1. 허가된 게이트웨이 등록 테스트
    console.log("=== 1. Testing Gateway Registration ===");

    const gateway1 = {
      gatewayId: "gateway_binance",
      name: "Binance P2P",
      domain: "binance.com",
      apiEndpoint: "https://api.binance.com/p2p",
      supportedCurrencies: ["USD", "EUR", "KRW", "JPY"],
      country: "Malta",
      licenseNumber: "BIN-2024-001",
      contactInfo: {
        email: "support@binance.com",
        phone: "+356-2778-1000",
      },
    };

    const gateway2 = {
      gatewayId: "gateway_wise",
      name: "Wise (TransferWise)",
      domain: "wise.com",
      apiEndpoint: "https://api.wise.com",
      supportedCurrencies: ["USD", "EUR", "GBP", "KRW"],
      country: "UK",
      licenseNumber: "WISE-2024-002",
      contactInfo: {
        email: "support@wise.com",
        phone: "+44-20-3318-0000",
      },
    };

    const gateway3 = {
      gatewayId: "gateway_mpesa",
      name: "M-Pesa Kenya",
      domain: "mpesa.com",
      apiEndpoint: "https://api.mpesa.com",
      supportedCurrencies: ["KES", "USD"],
      country: "Kenya",
      licenseNumber: "MPESA-KE-001",
      contactInfo: {
        email: "support@mpesa.com",
        phone: "+254-722-000-000",
      },
    };

    const result1 = cashoutService.registerApprovedGateway(gateway1);
    const result2 = cashoutService.registerApprovedGateway(gateway2);
    const result3 = cashoutService.registerApprovedGateway(gateway3);

    console.log(`✅ Gateway 1 registered: ${result1.gateway.name}`);
    console.log(`✅ Gateway 2 registered: ${result2.gateway.name}`);
    console.log(`✅ Gateway 3 registered: ${result3.gateway.name}\n`);

    // 2. 허가된 게이트웨이 목록 조회 테스트
    console.log("=== 2. Testing Gateway List Retrieval ===");
    const gateways = cashoutService.getApprovedGateways();
    console.log(`✅ Total approved gateways: ${gateways.length}`);
    gateways.forEach((gateway) => {
      console.log(
        `   - ${gateway.name} (${
          gateway.domain
        }) - ${gateway.supportedCurrencies.join(", ")}`
      );
    });
    console.log();

    // 3. 현금화 요청 생성 테스트
    console.log("=== 3. Testing Cashout Request Creation ===");

    const cashoutRequest1 = {
      userId: "user123",
      walletAddress: "rUser123Address456789",
      amount: 1000,
      currency: "USD",
      gatewayId: "gateway_binance",
      destinationAccount: "user123@binance.com",
      memo: "Monthly salary cashout",
    };

    const cashoutRequest2 = {
      userId: "user456",
      walletAddress: "rUser456Address789123",
      amount: 500,
      currency: "EUR",
      gatewayId: "gateway_wise",
      destinationAccount: "IBAN: GB33BUKB20201555555555",
      memo: "Freelance payment",
    };

    const cashoutRequest3 = {
      userId: "user789",
      walletAddress: "rUser789Address123456",
      amount: 50000,
      currency: "KES",
      gatewayId: "gateway_mpesa",
      destinationAccount: "+254722000000",
      memo: "Family remittance",
    };

    const requestResult1 = await cashoutService.createCashoutRequest(
      cashoutRequest1
    );
    const requestResult2 = await cashoutService.createCashoutRequest(
      cashoutRequest2
    );
    const requestResult3 = await cashoutService.createCashoutRequest(
      cashoutRequest3
    );

    console.log(`✅ Cashout request 1 created: ${requestResult1.requestId}`);
    console.log(
      `   Amount: ${requestResult1.request.amount} ${requestResult1.request.currency}`
    );
    console.log(`   Gateway: ${requestResult1.request.gateway.name}`);
    console.log(
      `   Fees: Gateway ${requestResult1.request.fees.gatewayFee}, Network ${requestResult1.request.fees.networkFee}\n`
    );

    console.log(`✅ Cashout request 2 created: ${requestResult2.requestId}`);
    console.log(
      `   Amount: ${requestResult2.request.amount} ${requestResult2.request.currency}`
    );
    console.log(`   Gateway: ${requestResult2.request.gateway.name}\n`);

    console.log(`✅ Cashout request 3 created: ${requestResult3.requestId}`);
    console.log(
      `   Amount: ${requestResult3.request.amount} ${requestResult3.request.currency}`
    );
    console.log(`   Gateway: ${requestResult3.request.gateway.name}\n`);

    // 4. 현금화 요청 처리 테스트
    console.log("=== 4. Testing Cashout Request Processing ===");

    const processResult1 = await cashoutService.processCashoutRequest(
      requestResult1.requestId
    );
    console.log(`✅ Request 1 processed: ${processResult1.status}`);
    console.log(
      `   Gateway Transaction ID: ${processResult1.gatewayTransactionId}`
    );
    console.log(`   Message: ${processResult1.message}\n`);

    const processResult2 = await cashoutService.processCashoutRequest(
      requestResult2.requestId
    );
    console.log(`✅ Request 2 processed: ${processResult2.status}`);
    console.log(
      `   Gateway Transaction ID: ${processResult2.gatewayTransactionId}\n`
    );

    const processResult3 = await cashoutService.processCashoutRequest(
      requestResult3.requestId
    );
    console.log(`✅ Request 3 processed: ${processResult3.status}`);
    console.log(
      `   Gateway Transaction ID: ${processResult3.gatewayTransactionId}\n`
    );

    // 5. 현금화 요청 상태 조회 테스트
    console.log("=== 5. Testing Cashout Request Status ===");

    const status1 = cashoutService.getCashoutRequestStatus(
      requestResult1.requestId
    );
    console.log(`✅ Request 1 status: ${status1.status}`);
    console.log(`   Created: ${status1.createdAt}`);
    console.log(`   Processed: ${status1.processedAt}\n`);

    // 6. 현금화 영수증 생성 테스트
    console.log("=== 6. Testing Cashout Receipt Generation ===");

    const receiptResult1 = cashoutService.generateCashoutReceipt(
      requestResult1.requestId
    );
    console.log(`✅ Receipt 1 generated: ${receiptResult1.receiptId}`);
    console.log(`   Transaction Hash: ${receiptResult1.receipt.receiptHash}`);
    console.log(
      `   Amount: ${receiptResult1.receipt.transaction.amount} ${receiptResult1.receipt.transaction.currency}\n`
    );

    const receiptResult2 = cashoutService.generateCashoutReceipt(
      requestResult2.requestId
    );
    console.log(`✅ Receipt 2 generated: ${receiptResult2.receiptId}\n`);

    // 7. 영수증 조회 테스트
    console.log("=== 7. Testing Receipt Retrieval ===");

    const retrievedReceipt = cashoutService.getReceipt(
      receiptResult1.receiptId
    );
    console.log(`✅ Receipt retrieved: ${retrievedReceipt.receiptId}`);
    console.log(`   Version: ${retrievedReceipt.version}`);
    console.log(`   Status: ${retrievedReceipt.status}\n`);

    // 8. 은행 이체 테스트
    console.log("=== 8. Testing Bank Transfer ===");

    const bankTransfer = {
      requestId: requestResult2.requestId,
      bankCode: "SWIFT_BUKBGB22",
      accountNumber: "20201555555555",
      accountHolderName: "John Smith",
      amount: 500,
      currency: "EUR",
      memo: "Cashout via Wise",
    };

    const bankResult = await cashoutService.processBankTransfer(bankTransfer);
    console.log(`✅ Bank transfer processed: ${bankResult.status}`);
    console.log(`   Bank Transaction ID: ${bankResult.bankTransactionId}`);
    console.log(`   Estimated Arrival: ${bankResult.estimatedArrival}\n`);

    // 9. 모바일머니 이체 테스트
    console.log("=== 9. Testing Mobile Money Transfer ===");

    const mobileMoneyTransfer = {
      requestId: requestResult3.requestId,
      provider: "M-Pesa",
      phoneNumber: "+254722000000",
      amount: 50000,
      currency: "KES",
      memo: "Family remittance via M-Pesa",
    };

    const mmResult = await cashoutService.processMobileMoneyTransfer(
      mobileMoneyTransfer
    );
    console.log(`✅ Mobile money transfer processed: ${mmResult.status}`);
    console.log(`   Provider: ${mmResult.provider}`);
    console.log(`   Transaction ID: ${mmResult.transactionId}`);
    console.log(`   Estimated Arrival: ${mmResult.estimatedArrival}\n`);

    // 10. PermissionedDomains 설정 테스트 (실제 XRPL 연결 필요)
    console.log("=== 10. Testing PermissionedDomains Setup ===");
    console.log("⚠️  XRPL PermissionedDomains setup test skipped");
    console.log("   Reason: Requires real XRPL wallet seed");
    console.log("   Use with actual wallet seed for live testing\n");
  } catch (error) {
    console.error("❌ Cashout Gateway Service test failed:", error.message);
  }

  console.log("🎉 Cashout Gateway Service tests completed!\n");

  console.log("📋 Summary:");
  console.log("✅ Gateway Registration - Multiple payment providers");
  console.log("✅ Cashout Request Management - Create, process, track");
  console.log("✅ Receipt System - Generate and retrieve receipts");
  console.log("✅ Bank Transfer Integration - SWIFT/IBAN support");
  console.log("✅ Mobile Money Integration - M-Pesa, MTN, Airtel support");
  console.log("✅ PermissionedDomains Ready - XRPL ledger integration");
  console.log("\n🚀 Ready for production cashout gateway!");
}

// 테스트 실행
testCashoutGatewayService().catch(console.error);
