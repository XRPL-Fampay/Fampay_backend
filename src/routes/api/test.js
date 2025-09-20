const express = require('express');
const {
  createTestUser,
  listUsers
} = require('../../controllers/testController');
const xrplCredentialService = require('../../services/xrplCredentialService');

const router = express.Router();

router.post('/users', createTestUser);
router.get('/users', listUsers);

// Generate funded test wallets for testing credentials
router.post('/wallets/generate', async (req, res) => {
  try {
    const { count = 2 } = req.body;
    
    if (count > 5) {
      return res.status(400).json({
        error: 'Maximum 5 wallets can be generated at once'
      });
    }
    
    const wallets = await xrplCredentialService.generateFundedTestWallets(count);
    
    res.json({
      success: true,
      wallets: wallets.map(w => ({
        address: w.address,
        publicKey: w.publicKey
        // Note: seed is not returned for security
      })),
      message: `Generated ${wallets.length} funded test wallets`
    });
  } catch (error) {
    console.error('Error generating test wallets:', error);
    res.status(500).json({
      error: 'Failed to generate test wallets',
      message: error.message
    });
  }
});

module.exports = router;