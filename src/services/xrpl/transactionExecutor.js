const createError = require('http-errors');
const xrpl = require('xrpl');
const { getClient } = require('../xrplClient');
const config = require('../../config');

function encodeMemo(memo) {
  if (!memo) return undefined;
  return [{ Memo: { MemoData: Buffer.from(memo, 'utf8').toString('hex') } }];
}

function resolveAmount({ currency = 'XRP', amountDrops, amountXrp, issuer }) {
  if (currency === 'XRP') {
    if (amountDrops) {
      return amountDrops;
    }
    if (amountXrp) {
      return xrpl.xrpToDrops(amountXrp);
    }
    throw createError(400, 'XRP 결제에는 amountDrops 또는 amountXrp가 필요합니다.');
  }

  const resolvedIssuer = issuer || getDefaultIssuerAddress();
  if (!resolvedIssuer) {
    throw createError(400, 'IOU 전송에는 issuer가 필요합니다.');
  }

  return {
    currency,
    issuer: resolvedIssuer,
    value: amountXrp || amountDrops
  };
}

let cachedIssuerAddress;
function getDefaultIssuerAddress() {
  if (cachedIssuerAddress) {
    return cachedIssuerAddress;
  }
  if (!config.xrpl.issuerSeed) {
    return undefined;
  }
  const wallet = xrpl.Wallet.fromSeed(config.xrpl.issuerSeed.trim());
  cachedIssuerAddress = wallet.address;
  return cachedIssuerAddress;
}

async function submitPayment({
  seed,
  destination,
  amountDrops,
  amountXrp,
  currency = 'XRP',
  issuer,
  memo
}) {
  if (!seed || !destination) {
    throw createError(400, 'seed와 destination은 필수입니다.');
  }

  const wallet = xrpl.Wallet.fromSeed(seed.trim());
  const amount = resolveAmount({ currency, amountDrops, amountXrp, issuer });

  const client = await getClient();
  const payment = {
    TransactionType: 'Payment',
    Account: wallet.address,
    Destination: destination,
    Amount: amount,
    Memos: encodeMemo(memo)
  };

  const prepared = await client.autofill(payment);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  const hash = result.result?.tx_json?.hash || signed.hash;

  return {
    hash,
    type: 'Payment',
    raw: result.result,
    account: wallet.address,
    destination,
    amount
  };
}

function toRippleTime(value) {
  if (!value) return undefined;
  if (typeof value === 'number') {
    return Math.floor(value);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createError(400, 'finishAfter/cancelAfter는 ISO 문자열 또는 epoch 초여야 합니다.');
  }
  return xrpl.isoTimeToRippleTime(date.toISOString());
}

async function submitBatch({ seed, instructions, memo }) {
  if (!Array.isArray(instructions) || instructions.length === 0) {
    throw createError(400, 'instructions 배열이 필요합니다.');
  }

  const defaultSeed = seed || config.xrpl.batchSeed;
  if (!defaultSeed) {
    throw createError(400, 'batch 트랜잭션에는 기본 seed가 필요합니다.');
  }

  const results = [];

  for (const instruction of instructions) {
    const paymentSeed = instruction.seed || defaultSeed;
    const destination = instruction.destination || instruction.xrplAddress;
    if (!destination) {
      throw createError(400, 'instruction에 destination이 필요합니다.');
    }

    const paymentPayload = {
      seed: paymentSeed,
      destination,
      amountDrops: instruction.amountDrops,
      amountXrp: instruction.amountXrp,
      currency: instruction.currency || 'XRP',
      issuer: instruction.issuer,
      memo: instruction.memo || memo
    };

    results.push(await submitPayment(paymentPayload));
  }

  return {
    type: 'Batch',
    count: results.length,
    results
  };
}

async function createEscrow({
  seed,
  destination,
  amountDrops,
  finishAfter,
  cancelAfter,
  condition,
  memo
}) {
  if (!seed || !destination || !amountDrops) {
    throw createError(400, 'seed, destination, amountDrops는 필수입니다.');
  }

  const wallet = xrpl.Wallet.fromSeed(seed.trim());
  const client = await getClient();

  const escrowCreate = {
    TransactionType: 'EscrowCreate',
    Account: wallet.address,
    Destination: destination,
    Amount: amountDrops,
    FinishAfter: toRippleTime(finishAfter),
    CancelAfter: toRippleTime(cancelAfter),
    Condition: condition,
    Memos: encodeMemo(memo)
  };

  const prepared = await client.autofill(escrowCreate);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);
  const hash = result.result?.tx_json?.hash || signed.hash;

  return {
    hash,
    type: 'EscrowCreate',
    raw: result.result,
    account: wallet.address,
    destination,
    amountDrops,
    offerSequence: prepared.Sequence
  };
}

async function finishEscrow({ seed, owner, offerSequence, condition, fulfillment, memo }) {
  if (!seed || !owner || typeof offerSequence === 'undefined') {
    throw createError(400, 'seed, owner, offerSequence는 필수입니다.');
  }

  const wallet = xrpl.Wallet.fromSeed(seed.trim());
  const client = await getClient();

  const escrowFinish = {
    TransactionType: 'EscrowFinish',
    Account: wallet.address,
    Owner: owner,
    OfferSequence: offerSequence,
    Condition: condition,
    Fulfillment: fulfillment,
    Memos: encodeMemo(memo)
  };

  const prepared = await client.autofill(escrowFinish);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);
  const hash = result.result?.tx_json?.hash || signed.hash;

  return {
    hash,
    type: 'EscrowFinish',
    raw: result.result,
    account: wallet.address,
    owner,
    offerSequence
  };
}

async function cancelEscrow({ seed, owner, offerSequence, memo }) {
  if (!seed || !owner || typeof offerSequence === 'undefined') {
    throw createError(400, 'seed, owner, offerSequence는 필수입니다.');
  }

  const wallet = xrpl.Wallet.fromSeed(seed.trim());
  const client = await getClient();

  const escrowCancel = {
    TransactionType: 'EscrowCancel',
    Account: wallet.address,
    Owner: owner,
    OfferSequence: offerSequence,
    Memos: encodeMemo(memo)
  };

  const prepared = await client.autofill(escrowCancel);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);
  const hash = result.result?.tx_json?.hash || signed.hash;

  return {
    hash,
    type: 'EscrowCancel',
    raw: result.result,
    account: wallet.address,
    owner,
    offerSequence
  };
}

async function executeXRPLTransaction({ type, payload }) {
  switch (type) {
    case 'CONTRIBUTION':
    case 'PAYOUT':
      return submitPayment(payload);
    case 'BATCH':
      return submitBatch(payload);
    case 'ESCROW_CREATE':
      return createEscrow(payload);
    case 'ESCROW_FINISH':
      return finishEscrow(payload);
    case 'ESCROW_CANCEL':
      return cancelEscrow(payload);
    default:
      throw createError(400, `XRPL 실행을 지원하지 않는 트랜잭션 타입입니다: ${type}`);
  }
}

module.exports = {
  submitPayment,
  submitBatch,
  createEscrow,
  finishEscrow,
  cancelEscrow,
  executeXRPLTransaction
};
