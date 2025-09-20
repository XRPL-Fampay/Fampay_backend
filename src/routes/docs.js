const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "XRPL Grouppay Backend API",
    version: "1.0.0",
    description: `
# XRPL Grouppay Backend API

XRPL 기반 그룹 지갑 서비스를 위한 백엔드 API입니다.

## 주요 기능
- **인증 시스템**: JWT 기반 사용자 인증 및 권한 관리
- **키 관리**: XRPL 지갑 생성, 복구, 멀티시그, 소셜 리커버리
- **그룹 관리**: 그룹 생성, 멤버 관리, 권한 설정
- **트랜잭션**: XRPL 기반 그룹 결제 및 현금화
- **보안**: 2FA, 생체인증, Rate Limiting

## 인증 방식
Bearer Token을 사용한 JWT 인증이 필요합니다.
\`Authorization: Bearer <your-jwt-token>\`

## 기본 URL
- 개발: \`http://localhost:3001/api\`
- 프로덕션: \`https://api.grouppay.com/api\`
    `,
    contact: {
      name: "Grouppay Development Team",
      email: "dev@grouppay.com",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "http://localhost:3001/api",
      description: "개발 서버",
    },
    {
      url: "http://localhost:3000/api",
      description: "로컬 서버 (기본)",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          fullName: { type: "string" },
          role: { type: "string", enum: ["USER", "ADMIN"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AuthTokens: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
          refreshTokenExpiresAt: { type: "string", format: "date-time" },
        },
      },
      Wallet: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          xrplAddress: { type: "string" },
          publicKey: { type: "string" },
          label: { type: "string" },
          ownerUserId: { type: ["string", "null"], format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      GroupMember: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          groupId: { type: "string", format: "uuid" },
          role: { type: "string", enum: ["HOST", "ADMIN", "MEMBER"] },
          status: { type: "string", enum: ["PENDING", "ACTIVE", "REMOVED"] },
        },
      },
      Group: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          description: { type: ["string", "null"] },
          hostUserId: { type: "string", format: "uuid" },
          groupWalletId: { type: "string", format: "uuid" },
          members: {
            type: "array",
            items: { $ref: "#/components/schemas/GroupMember" },
          },
        },
      },
      Transaction: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          groupId: { type: "string", format: "uuid" },
          type: {
            type: "string",
            enum: [
              "CONTRIBUTION",
              "PAYOUT",
              "ESCROW_CREATE",
              "ESCROW_FINISH",
              "ESCROW_CANCEL",
              "BATCH",
            ],
          },
          amountDrops: { type: "string" },
          currency: { type: "string" },
          memo: { type: ["string", "null"] },
          status: { type: "string", enum: ["PENDING", "CONFIRMED", "FAILED"] },
          xrplHash: { type: ["string", "null"] },
          submittedAt: { type: "string", format: "date-time" },
        },
      },
      RecurringPlan: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          groupId: { type: "string", format: "uuid" },
          type: { type: "string", enum: ["CONTRIBUTION", "PAYOUT"] },
          amountDrops: { type: "string" },
          scheduleCron: { type: "string" },
          status: { type: "string", enum: ["ACTIVE", "PAUSED", "CANCELLED"] },
        },
      },
      PermissionedDomain: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          groupId: { type: "string", format: "uuid" },
          domain: { type: "string" },
          label: { type: ["string", "null"] },
          verifiedAt: { type: ["string", "null"], format: "date-time" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              message: { type: "string" },
              details: { type: ["array", "object"] },
            },
          },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ["src/routes/api/*.js", "src/controllers/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

const router = express.Router();
router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = router;
