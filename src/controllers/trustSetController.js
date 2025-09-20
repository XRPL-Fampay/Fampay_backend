const XRPLTrustSetService = require("../services/xrplTrustSetService");

/**
 * TrustSet 관련 API 컨트롤러
 */
class TrustSetController {
  constructor() {
    this.trustSetService = new XRPLTrustSetService();
  }

  /**
   * TrustLine 생성 API
   * POST /api/trustset/create
   */
  async createTrustLine(req, res) {
    try {
      const { userSeed, issuerAddress, currencyCode, limit } = req.body;

      // 입력 검증
      if (!userSeed || !issuerAddress || !currencyCode || !limit) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: userSeed, issuerAddress, currencyCode, limit",
        });
      }

      // TrustLine 생성
      const result = await this.trustSetService.createTrustLine(
        userSeed,
        issuerAddress,
        currencyCode,
        limit
      );

      res.status(200).json({
        success: true,
        message: "TrustLine created successfully",
        data: result,
      });
    } catch (error) {
      console.error("TrustLine creation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create TrustLine",
        error: error.message,
      });
    }
  }

  /**
   * TrustLine 목록 조회 API
   * GET /api/trustset/lines/:address
   */
  async getTrustLines(req, res) {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({
          success: false,
          message: "Address parameter is required",
        });
      }

      const trustLines = await this.trustSetService.getTrustLines(address);

      res.status(200).json({
        success: true,
        message: "TrustLines retrieved successfully",
        data: {
          address,
          trustLines,
          count: trustLines.length,
        },
      });
    } catch (error) {
      console.error("TrustLines retrieval error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve TrustLines",
        error: error.message,
      });
    }
  }

  /**
   * RequireAuth 상태 확인 API
   * GET /api/trustset/require-auth/:issuerAddress
   */
  async checkRequireAuth(req, res) {
    try {
      const { issuerAddress } = req.params;

      if (!issuerAddress) {
        return res.status(400).json({
          success: false,
          message: "Issuer address parameter is required",
        });
      }

      const requireAuth = await this.trustSetService.checkRequireAuth(
        issuerAddress
      );

      res.status(200).json({
        success: true,
        message: "RequireAuth status retrieved successfully",
        data: {
          issuerAddress,
          requireAuth,
        },
      });
    } catch (error) {
      console.error("RequireAuth check error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check RequireAuth status",
        error: error.message,
      });
    }
  }

  /**
   * 가족 그룹 신뢰 관계 구축 API
   * POST /api/trustset/family-trust
   */
  async establishFamilyTrust(req, res) {
    try {
      const { familyMembers, familyTokenIssuer, familyTokenCode, trustLimit } =
        req.body;

      // 입력 검증
      if (
        !familyMembers ||
        !Array.isArray(familyMembers) ||
        familyMembers.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "familyMembers array is required and cannot be empty",
        });
      }

      if (!familyTokenIssuer || !familyTokenCode || !trustLimit) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: familyTokenIssuer, familyTokenCode, trustLimit",
        });
      }

      // 가족 구성원 정보 검증
      for (const member of familyMembers) {
        if (!member.seed || !member.address) {
          return res.status(400).json({
            success: false,
            message: "Each family member must have seed and address",
          });
        }
      }

      // 가족 신뢰 관계 구축
      const results = await this.trustSetService.establishFamilyTrust(
        familyMembers,
        familyTokenIssuer,
        familyTokenCode,
        trustLimit
      );

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      res.status(200).json({
        success: true,
        message: "Family trust establishment completed",
        data: {
          totalMembers: familyMembers.length,
          successCount,
          failureCount,
          results,
        },
      });
    } catch (error) {
      console.error("Family trust establishment error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to establish family trust",
        error: error.message,
      });
    }
  }

  /**
   * TrustLine 제거 API
   * DELETE /api/trustset/remove
   */
  async removeTrustLine(req, res) {
    try {
      const { userSeed, issuerAddress, currencyCode } = req.body;

      // 입력 검증
      if (!userSeed || !issuerAddress || !currencyCode) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: userSeed, issuerAddress, currencyCode",
        });
      }

      // TrustLine 제거
      const result = await this.trustSetService.removeTrustLine(
        userSeed,
        issuerAddress,
        currencyCode
      );

      res.status(200).json({
        success: true,
        message: "TrustLine removed successfully",
        data: result,
      });
    } catch (error) {
      console.error("TrustLine removal error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove TrustLine",
        error: error.message,
      });
    }
  }
}

module.exports = new TrustSetController();
