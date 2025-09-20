const createError = require('http-errors');
const xrpl = require('xrpl');
const { getClient, getNetworkConfig } = require('../xrplClient');

function sanitizeWallet(wallet) {
  if (!wallet) {
    return null;
  }

  return {
    address: wallet.address,
    publicKey: wallet.publicKey,
    seed: wallet.seed,
    classicAddress: wallet.classicAddress || wallet.address
  };
}

function mapTrustLines(lines = []) {
  return lines.map((line) => ({
    account: line.account,
    balance: line.balance,
    currency: line.currency,
    limit: line.limit,
    limitPeer: line.limit_peer,
    qualityIn: line.quality_in,
    qualityOut: line.quality_out
  }));
}

async function generateWallet({ fund = false } = {}) {
  const wallet = xrpl.Wallet.generate();
  let funding;

  if (fund) {
    const client = await getClient();
    try {
      const result = await client.fundWallet(wallet, { faucetHost: undefined });
      funding = {
        balance: result.balance,
        balanceDrops: result.balance && xrpl.xrpToDrops(result.balance),
        amount: result.amount,
        transactionHash: result.tx_json?.hash
      };
    } catch (error) {
      throw createError(502, `XRPL faucet funding failed: ${error.message}`);
    }
  }

  return {
    wallet: sanitizeWallet(wallet),
    funded: fund,
    funding,
    network: getNetworkConfig()
  };
}

async function faucetWallet({ seed, address }) {
  if (!seed && !address) {
    throw createError(400, 'seed 또는 address 중 하나는 필수입니다.');
  }

  let wallet;
  if (seed) {
    try {
      wallet = xrpl.Wallet.fromSeed(seed.trim());
    } catch (error) {
      throw createError(400, `잘못된 시드입니다: ${error.message}`);
    }
  } else if (address) {
    if (!xrpl.isValidClassicAddress(address)) {
      throw createError(400, '유효하지 않은 XRPL 주소입니다.');
    }
    wallet = { address };
  }

  const client = await getClient();
  try {
    const result = await client.fundWallet(wallet, { faucetHost: undefined });
    return {
      wallet: sanitizeWallet(wallet.seed ? wallet : { ...wallet, seed }),
      funded: true,
      funding: {
        balance: result.balance,
        amount: result.amount,
        transactionHash: result.tx_json?.hash
      },
      network: getNetworkConfig()
    };
  } catch (error) {
    throw createError(502, `XRPL faucet funding failed: ${error.message}`);
  }
}

async function getWalletInfo(address) {
  if (!address || !xrpl.isValidClassicAddress(address)) {
    throw createError(400, '유효한 XRPL 주소가 필요합니다.');
  }

  const client = await getClient();

  try {
    const [xrpBalance, accountInfo, trustLines] = await Promise.all([
      client.getXrpBalance(address).catch(() => '0'),
      client.request({ command: 'account_info', account: address, ledger_index: 'validated' }).catch((error) => {
        if (error.data?.error === 'actNotFound') {
          return null;
        }
        throw error;
      }),
      client.request({ command: 'account_lines', account: address }).catch((error) => {
        if (error.data?.error === 'actNotFound') {
          return { result: { lines: [] } };
        }
        throw error;
      })
    ]);

    return {
      address,
      balance: xrpBalance,
      account: accountInfo?.result?.account_data || null,
      trustLines: mapTrustLines(trustLines?.result?.lines),
      network: getNetworkConfig()
    };
  } catch (error) {
    if (error.data?.error === 'actNotFound') {
      throw createError(404, 'XRPL에 계정이 존재하지 않습니다.');
    }

    throw createError(502, `XRPL 조회 실패: ${error.message}`);
  }
}

function validateAddress(address) {
  return xrpl.isValidClassicAddress(address);
}

module.exports = {
  generateWallet,
  faucetWallet,
  getWalletInfo,
  validateAddress
};
