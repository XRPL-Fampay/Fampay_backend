const express = require('express');
const healthRouter = require('./health');
const walletsRouter = require('./wallets');
const groupsRouter = require('./groups');

const router = express.Router();

router.use('/health', healthRouter);
router.use('/wallets', walletsRouter);
router.use('/groups', groupsRouter);

router.get('/', (req, res) => {
  res.json({
    message: 'XRPL Group Wallet API',
    endpoints: {
      health: '/api/health',
      wallets: '/api/wallets',
      groups: '/api/groups',
      groupTransactions: '/api/groups/:groupId/transactions'
    }
  });
});

module.exports = router;
