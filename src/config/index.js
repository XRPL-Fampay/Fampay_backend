const path = require('path');
const dotenv = require('dotenv');

const envFile = process.env.ENV_FILE || `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''}`;

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL || ''
  },
  xrpl: {
    network: process.env.XRPL_NETWORK || 'testnet',
    endpoint: process.env.XRPL_ENDPOINT || 'wss://s.altnet.rippletest.net:51233'
  },
  auth: {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'dev-access-secret',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret',
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
    refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '7d'
  },
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || 'dev-encryption-key'
  }
};

if (!config.database.url) {
  throw new Error('DATABASE_URL must be defined');
}

if (!config.xrpl.endpoint) {
  throw new Error('XRPL_ENDPOINT must be defined');
}

module.exports = config;
