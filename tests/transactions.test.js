jest.mock('../src/services/xrpl/transactionExecutor', () => ({
  executeXRPLTransaction: jest.fn()
}));

const request = require('supertest');

const mockGroup = { id: 'group-1' };
const mockTransactionRecord = {
  id: 'tx-1',
  groupId: 'group-1',
  type: 'CONTRIBUTION',
  amountDrops: '1000',
  currency: 'XRP',
  memo: null,
  status: 'CONFIRMED',
  xrplHash: 'ABC123',
  submittedAt: new Date().toISOString()
};
const mockRecurringPlan = { id: 'plan-1' };

const txContext = {
  group: {
    findUnique: jest.fn(async () => mockGroup)
  },
  wallet: {
    findUnique: jest.fn(async () => ({ id: 'wallet-1' }))
  },
  recurringPlan: {
    findUnique: jest.fn(async () => mockRecurringPlan)
  },
  transaction: {
    create: jest.fn(async () => ({ ...mockTransactionRecord, status: 'PENDING' }))
  }
};

const prismaMock = {
  $transaction: jest.fn(async (callback) => callback(txContext)),
  group: {
    findUnique: jest.fn(async () => mockGroup)
  },
  transaction: {
    update: jest.fn(async () => mockTransactionRecord),
    findMany: jest.fn(async () => [mockTransactionRecord])
  }
};

describe('Transactions API', () => {
  let app;
  let transactionExecutor;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.XRPL_BATCH_SEED = 'sTestSeed';
    transactionExecutor = require('../src/services/xrpl/transactionExecutor');
    transactionExecutor.executeXRPLTransaction.mockResolvedValue({
      hash: 'ABC123',
      type: 'Payment',
      raw: {},
      account: 'rSource',
      destination: 'rDest',
      amount: '1000'
    });
    jest.doMock('../src/db/prisma', () => ({ prisma: prismaMock }));
    app = require('../src/app');
  });

  it('creates transaction and executes XRPL payment when requested', async () => {
    const response = await request(app)
      .post('/api/groups/group-1/transactions')
      .send({
        type: 'CONTRIBUTION',
        amountDrops: '1000',
        xrpl: {
          execute: true,
          seed: 's████',
          destination: 'rDest'
        }
      });

    expect(response.status).toBe(201);
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.transaction.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'tx-1' }
    }));
    expect(response.body.xrpl.hash).toBe('ABC123');
  });

  it('creates batch transaction with xrpl instructions', async () => {
    transactionExecutor.executeXRPLTransaction.mockResolvedValueOnce({
      type: 'Batch',
      count: 2,
      results: [
        { hash: 'HASH1', destination: 'rDest1', amount: '500' },
        { hash: 'HASH2', destination: 'rDest2', amount: '500' }
      ]
    });

    const response = await request(app)
      .post('/api/groups/group-1/transactions')
      .send({
        type: 'BATCH',
        amountDrops: '1000',
        xrpl: {
          execute: true,
          instructions: [
            { seed: 's████', destination: 'rDest1', amountDrops: '500' },
            { seed: 's████', destination: 'rDest2', amountDrops: '500' }
          ]
        }
      });

    expect(response.status).toBe(201);
    expect(transactionExecutor.executeXRPLTransaction).toHaveBeenCalledWith(expect.objectContaining({
      type: 'BATCH',
      payload: expect.objectContaining({
        instructions: expect.arrayContaining([
          expect.objectContaining({ seed: expect.any(String) })
        ])
      })
    }));
    expect(response.body.xrpl.count).toBe(2);
  });

  it('lists transactions for group', async () => {
    const response = await request(app).get('/api/groups/group-1/transactions');
    expect(response.status).toBe(200);
    expect(prismaMock.transaction.findMany).toHaveBeenCalled();
    expect(Array.isArray(response.body)).toBe(true);
  });
});
