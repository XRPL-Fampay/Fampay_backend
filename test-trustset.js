require("dotenv").config();
const XRPLTrustSetService = require("./src/services/xrplTrustSetService");

async function testTrustSetService() {
  console.log("🚀 Testing XRPL TrustSet Service...\n");

  const trustSetService = new XRPLTrustSetService();

  try {
    // 1. XRPL 연결 테스트
    console.log("1. Testing XRPL connection...");
    await trustSetService.connect();
    console.log("✅ XRPL connection successful\n");

    // 2. RequireAuth 확인 테스트 (Bitstamp USD issuer)
    console.log("2. Testing RequireAuth check...");
    const issuerAddress = "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"; // Bitstamp USD issuer
    const requireAuth = await trustSetService.checkRequireAuth(issuerAddress);
    console.log(`✅ RequireAuth for ${issuerAddress}: ${requireAuth}\n`);

    // 3. TrustLines 조회 테스트
    console.log("3. Testing TrustLines retrieval...");
    const testAddress = "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"; // 테스트 주소
    const trustLines = await trustSetService.getTrustLines(testAddress);
    console.log(
      `✅ TrustLines for ${testAddress}:`,
      trustLines.length,
      "lines found\n"
    );

    // TrustLines 상세 정보 출력
    if (trustLines.length > 0) {
      console.log("📋 TrustLine details:");
      trustLines.slice(0, 3).forEach((line, index) => {
        console.log(
          `  ${index + 1}. Currency: ${line.currency}, Balance: ${
            line.balance
          }, Limit: ${line.limit}`
        );
      });
      console.log("");
    }

    console.log("🎉 All TrustSet tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await trustSetService.disconnect();
    console.log("👋 Disconnected from XRPL");
  }
}

// 테스트 실행
testTrustSetService();
