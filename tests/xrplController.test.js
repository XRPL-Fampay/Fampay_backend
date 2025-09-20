const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/services/xrpl/transactionExecutor', () => ({
  submitPayment: jest.fn(async () => ({ hash: 'PAY', account: 'rSource', destination: 'rDest' })),
  submitBatch: jest.fn(async () => ({ type: 'Batch', count: 2, results: [] })),
  createEscrow: jest.fn(async () => ({ hash: 'ESCROW', offerSequence: 123 })),
  finishEscrow: jest.fn(async () => ({ hash: 'FINISH' })),
  cancelEscrow: jest.fn(async () => ({ hash: 'CANCEL' }))
}));

const xrplExecutor = require('../src/services/xrpl/transactionExecutor');

describe('XRPL API', () => {
  let app;
  let token;

  beforeEach(() => {
    jest.clearAllMocks();
    app = require('../src/app');
    token = `Bearer ${jwt.sign({ sub: 'user-1', role: 'ADMIN' }, 'dev-access-secret')}`;
  });

  it('sends payment', async () => {
    const response = await request(app)
      .post('/api/xrpl/payment')
      .set('Authorization', token)
      .send({ seed: 's████', destination: 'rDest', amountDrops: '1000' });

    expect(response.status).toBe(201);
    expect(xrplExecutor.submitPayment).toHaveBeenCalled();
  });

  it('sends batch payment', async () => {
    const response = await request(app)
      .post('/api/xrpl/batch')
      .set('Authorization', token)
      .send({ instructions: [{ destination: 'rDest', amountDrops: '1000' }] });

    expect(response.status).toBe(201);
    expect(xrplExecutor.submitBatch).toHaveBeenCalled();
  });

  it('creates escrow', async () => {
    const response = await request(app)
      .post('/api/xrpl/escrow/create')
      .set('Authorization', token)
      .send({ seed: 's████', destination: 'rDest', amountDrops: '1000' });

    expect(response.status).toBe(201);
    expect(xrplExecutor.createEscrow).toHaveBeenCalled();
  });

  it('finishes escrow', async () => {
    const response = await request(app)
      .post('/api/xrpl/escrow/finish')
      .set('Authorization', token)
      .send({ seed: 's████', owner: 'rSource', offerSequence: 1 });

    expect(response.status).toBe(200);
    expect(xrplExecutor.finishEscrow).toHaveBeenCalled();
  });

  it('cancels escrow', async () => {
    const response = await request(app)
      .post('/api/xrpl/escrow/cancel')
      .set('Authorization', token)
      .send({ seed: 's████', owner: 'rSource', offerSequence: 1 });

    expect(response.status).toBe(200);
    expect(xrplExecutor.cancelEscrow).toHaveBeenCalled();
  });
});
