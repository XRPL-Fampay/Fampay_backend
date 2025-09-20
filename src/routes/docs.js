const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'XRPL Grouppay Backend API',
    version: '0.1.0',
    description: 'API documentation for Grouppay XRPL backend services'
  },
  servers: [
    {
      url: '/api'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      Wallet: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          xrplAddress: { type: 'string' },
          publicKey: { type: 'string' },
          label: { type: 'string' },
          ownerUserId: { type: ['string', 'null'], format: 'uuid' }
        }
      },
      GroupMember: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          groupId: { type: 'string', format: 'uuid' },
          role: { type: 'string', enum: ['HOST', 'ADMIN', 'MEMBER'] },
          status: { type: 'string', enum: ['PENDING', 'ACTIVE', 'REMOVED'] }
        }
      },
      Group: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: ['string', 'null'] },
          hostUserId: { type: 'string', format: 'uuid' },
          groupWalletId: { type: 'string', format: 'uuid' },
          members: {
            type: 'array',
            items: { $ref: '#/components/schemas/GroupMember' }
          }
        }
      },
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          groupId: { type: 'string', format: 'uuid' },
          type: {
            type: 'string',
            enum: ['CONTRIBUTION', 'PAYOUT', 'ESCROW_CREATE', 'ESCROW_FINISH', 'ESCROW_CANCEL', 'BATCH']
          },
          amountDrops: { type: 'string' },
          currency: { type: 'string' },
          memo: { type: ['string', 'null'] },
          status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'FAILED'] },
          xrplHash: { type: ['string', 'null'] },
          submittedAt: { type: 'string', format: 'date-time' }
        }
      },
      RecurringPlan: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          groupId: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['CONTRIBUTION', 'PAYOUT'] },
          amountDrops: { type: 'string' },
          scheduleCron: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'CANCELLED'] }
        }
      },
      PermissionedDomain: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          groupId: { type: 'string', format: 'uuid' },
          domain: { type: 'string' },
          label: { type: ['string', 'null'] },
          verifiedAt: { type: ['string', 'null'], format: 'date-time' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              details: { type: ['array', 'object'] }
            }
          }
        }
      }
    }
  }
};

const options = {
  swaggerDefinition,
  apis: ['src/routes/api/*.js', 'src/controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

const router = express.Router();
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = router;
