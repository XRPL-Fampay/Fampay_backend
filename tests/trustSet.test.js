const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/services/xrpl/trustSetService', () => ({
  setupTrustLine: jest.fn(),
  authorizeTrustLine: jest.fn()
}));

const trustSetService = require('../src/services/xrpl/trustSetService');

describe('TrustSet API', () => {
  let app;
  beforeEach(() => {
    jest.clearAllMocks();
    trustSetService.setupTrustLine.mockResolvedValue({ hash: 'ABC', account: 'rSource' });
    trustSetService.authorizeTrustLine.mockResolvedValue({ hash: 'XYZ', account: 'rIssuer' });
    app = require('../src/app');
  });

  it('creates trust line limit', async () => {
    const response = await request(app)
      .post('/api/trustset/setup')
      .send({ seed: 's████', currency: 'ABC', issuer: 'rIssuer', limit: '100' });

    expect(response.status).toBe(201);
    expect(trustSetService.setupTrustLine).toHaveBeenCalled();
  });

  it('authorizes trust line', async () => {
    const response = await request(app)
      .post('/api/trustset/authorize')
      .send({ seed: 's████', currency: 'ABC', counterparty: 'rCounter' });

    expect(response.status).toBe(200);
    expect(trustSetService.authorizeTrustLine).toHaveBeenCalled();
  });
});
