const express = require('express');
const healthRouter = require('./health');
const walletsRouter = require('./wallets');
const groupsRouter = require('./groups');
const authRouter = require('./auth');
const keysRouter = require('./keys');
const cashoutRouter = require('./cashout');
const trustsetRouter = require('./trustset');
const xrplRouter = require('./xrpl');

const router = express.Router();

router.use('/health', healthRouter);
router.use('/wallets', walletsRouter);
router.use('/auth', authRouter);
router.use('/keys', keysRouter);
router.use('/groups', groupsRouter);
router.use('/cashout', cashoutRouter);
router.use('/trustset', trustsetRouter);
router.use('/xrpl', xrplRouter);

router.get('/', (req, res) => {
  res.json({
    message: 'XRPL Group Wallet API',
    endpoints: {
      health: '/api/health',
      wallets: '/api/wallets',
      auth: '/api/auth',
      keys: '/api/keys',
      groups: '/api/groups',
      groupTransactions: '/api/groups/:groupId/transactions',
      cashout: '/api/cashout',
      trustset: '/api/trustset',
      xrpl: '/api/xrpl'
    }
  });
});

module.exports = router;
