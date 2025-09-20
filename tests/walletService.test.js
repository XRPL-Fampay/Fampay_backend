const xrpl = require('xrpl');
const request = require('supertest');
const app = require('../src/app');
const walletService = require('../src/services/xrpl/walletService');

jest.mock('xrpl', () => {
  const actual = jest.requireActual('xrpl');
  return {
    ...actual,
    Wallet: {
      generate: jest.fn(() => ({
        address: 'rMockAddress',
        publicKey: 'mockPublicKey',
        seed: 'mockSeed'
      })),
      fromSeed: actual.Wallet.fromSeed
    },
    isValidClassicAddress: actual.isValidClassicAddress,
    Client: actual.Client
  };
});

describe('walletService.generateWallet', () => {
  it('generates wallet without network funding', async () => {
    const result = await walletService.generateWallet({ fund: false });

    expect(result.wallet).toMatchObject({
      address: 'rMockAddress',
      publicKey: 'mockPublicKey',
      seed: 'mockSeed'
    });
    expect(result.funded).toBe(false);
  });
});

describe('POST /api/wallets/validate', () => {
  it('returns validation result', async () => {
    const payload = { address: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe' };
    const response = await request(app)
      .post('/api/wallets/validate')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ address: payload.address, isValid: true });
  });
});
