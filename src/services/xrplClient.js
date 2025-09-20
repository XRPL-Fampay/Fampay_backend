const xrpl = require('xrpl');
const config = require('../config');

let client;
let connectingPromise;

async function getClient() {
  if (client && client.isConnected()) {
    return client;
  }

  if (!connectingPromise) {
    const xrplClient = new xrpl.Client(config.xrpl.endpoint, {
      connectionTimeout: 10_000
    });

    connectingPromise = xrplClient.connect()
      .then(() => {
        client = xrplClient;
        connectingPromise = null;
        return client;
      })
      .catch((error) => {
        connectingPromise = null;
        client = null;
        throw error;
      });
  }

  return connectingPromise;
}

async function getStatus() {
  try {
    const xrplClient = await getClient();
    const response = await xrplClient.request({ command: 'server_info' });

    return {
      connected: true,
      network: config.xrpl.network,
      endpoint: config.xrpl.endpoint,
      serverInfo: response.result.info
    };
  } catch (error) {
    return {
      connected: false,
      network: config.xrpl.network,
      endpoint: config.xrpl.endpoint,
      error: error.message
    };
  }
}

async function disconnect() {
  if (client && client.isConnected()) {
    await client.disconnect();
    client = null;
  }
}

function getNetworkConfig() {
  return {
    network: config.xrpl.network,
    endpoint: config.xrpl.endpoint
  };
}

module.exports = {
  getClient,
  getStatus,
  disconnect,
  getNetworkConfig
};
