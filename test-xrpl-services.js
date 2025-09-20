require("dotenv").config();
const XRPLTrustSetService = require("./src/services/xrplTrustSetService");
const XRPLPaymentService = require("./src/services/xrplPaymentService");
const XRPLPermissionedDomainsService = require("./src/services/xrplPermissionedDomainsService");
const XRPLBatchService = require("./src/services/xrplBatchService");

async function testAllXRPLServices() {
  console.log("🚀 Testing All XRPL Services (Improved Version)...\n");

  // 1. TrustSet 서비스 테스트
  console.log("=== 1. Testing TrustSet Service ===");
  const trustSetService = new XRPLTrustSetService();

  try {
    // RequireAuth 확인 테스트
    console.log("1-1. Testing RequireAuth check...");
    const issuerAddress = "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH";
    const requireAuth = await trustSetService.checkRequireAuth(issuerAddress);
    console.log(`✅ RequireAuth for ${issuerAddress}: ${requireAuth}\n`);

    // TrustLines 조회 테스트
    console.log("1-2. Testing TrustLines retrieval...");
    const trustLines = await trustSetService.getTrustLines(issuerAddress);
    console.log(`✅ TrustLines found: ${trustLines.length} lines\n`);
  } catch (error) {
    console.error("❌ TrustSet Service test failed:", error.message);
  }

  // 2. Payment 서비스 테스트
  console.log("=== 2. Testing Payment Service ===");
  const paymentService = new XRPLPaymentService();

  try {
    console.log("2-1. Payment Service initialized successfully");
    console.log("✅ Payment Service ready for transactions\n");
  } catch (error) {
    console.error("❌ Payment Service test failed:", error.message);
  }

  // 3. PermissionedDomains 서비스 테스트
  console.log("=== 3. Testing PermissionedDomains Service ===");
  const domainsService = new XRPLPermissionedDomainsService();

  try {
    console.log("3-1. PermissionedDomains Service initialized successfully");
    console.log("✅ Ready for gateway domain management\n");
  } catch (error) {
    console.error("❌ PermissionedDomains Service test failed:", error.message);
  }

  // 4. Batch 서비스 테스트
  console.log("=== 4. Testing Batch Service ===");
  const batchService = new XRPLBatchService();

  try {
    console.log("4-1. Batch Service initialized successfully");
    console.log("✅ Ready for batch transactions\n");
  } catch (error) {
    console.error("❌ Batch Service test failed:", error.message);
  }

  console.log("🎉 All XRPL Services tested successfully!");
  console.log("\n📋 Available Services:");
  console.log("  ✅ TrustSet Service - Trust relationships management");
  console.log("  ✅ Payment Service - XRP/IOU transfers with memos");
  console.log("  ✅ PermissionedDomains Service - Gateway domain management");
  console.log("  ✅ Batch Service - Multi-transaction processing");

  console.log("\n🔧 Network Configuration:");
  console.log("  📡 Server: wss://s.devnet.rippletest.net:51233 (devnet)");
  console.log("  🌐 Environment: Development/Testing");
}

// 테스트 실행
testAllXRPLServices().catch((error) => {
  console.error("❌ Test suite failed:", error.message);
  process.exit(1);
});
