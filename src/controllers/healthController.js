const pkg = require('../../package.json');
const config = require('../config');
const { getNetworkConfig, getStatus } = require('../services/xrplClient');

async function healthCheck(req, res) {
  const xrplInfo = req.query.xrpl === 'full'
    ? await getStatus()
    : getNetworkConfig();

  res.json({
    status: 'ok',
    service: pkg.name,
    version: pkg.version,
    environment: config.env,
    xrpl: xrplInfo,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  healthCheck
};
