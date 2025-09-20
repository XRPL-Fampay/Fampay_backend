const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Grouppay backend is running. Use /api for REST endpoints.'
  });
});

module.exports = router;
