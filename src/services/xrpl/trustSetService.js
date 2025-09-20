const createError = require('http-errors');
const xrpl = require('xrpl');
const { getClient } = require('../xrplClient');
const config = require('../../config');

const TRUST_AUTH_FLAG = xrpl.TrustSetFlags?.tfSetfAuth || 0x00010000;

function encodeMemo(memo) {
  if (!memo) return undefined;
  return [{ Memo: { MemoData: Buffer.from(memo, 'utf8').toString('hex') } }];
}

function buildLimitAmount({ currency, issuer, value }) {
  if (!currency || !issuer || !value) {
    throw createError(400, 'currency, issuer, value는 필수입니다.');
  }
  return { currency, issuer, value: value.toString() };
}

async function setupTrustLine({ seed, currency, issuer, limit, memo, flags }) {
  if (!seed) {
    throw createError(400, 'seed는 필수입니다.');
  }
  if (!limit) {
    throw createError(400, 'limit 값이 필요합니다.');
  }

  const wallet = xrpl.Wallet.fromSeed(seed.trim());
  const client = await getClient();

  const tx = {
    TransactionType: 'TrustSet',
    Account: wallet.address,
    LimitAmount: buildLimitAmount({ currency, issuer, value: limit }),
    Flags: flags,
    Memos: encodeMemo(memo)
  };

  const prepared = await client.autofill(tx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);
  const hash = result.result?.tx_json?.hash || signed.hash;

  return {
    hash,
    type: 'TrustSet',
    raw: result.result,
    account: wallet.address,
    limit: tx.LimitAmount
  };
}

async function authorizeTrustLine({ seed, currency, counterparty, memo }) {
  const issuerSeed = seed || config.xrpl.issuerSeed;
  if (!issuerSeed) {
    throw createError(400, 'issuer seed가 필요합니다.');
  }
  const wallet = xrpl.Wallet.fromSeed(issuerSeed.trim());
  const client = await getClient();

  const tx = {
    TransactionType: 'TrustSet',
    Account: wallet.address,
    LimitAmount: buildLimitAmount({ currency, issuer: counterparty, value: '0' }),
    Flags: TRUST_AUTH_FLAG,
    Memos: encodeMemo(memo)
  };

  const prepared = await client.autofill(tx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);
  const hash = result.result?.tx_json?.hash || signed.hash;

  return {
    hash,
    type: 'TrustSetAuthorize',
    raw: result.result,
    account: wallet.address,
    counterparty
  };
}

module.exports = {
  setupTrustLine,
  authorizeTrustLine
};
