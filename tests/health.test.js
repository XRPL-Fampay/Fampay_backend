const request = require('supertest');
const app = require('../src/app');

describe('GET /health', () => {
  it('responds with service status and XRPL config', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      service: expect.any(String),
      xrpl: expect.objectContaining({
        network: expect.any(String),
        endpoint: expect.any(String)
      })
    });
  });
});

describe('GET /api/health', () => {
  it('returns status payload similar to /health', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      service: expect.any(String),
      xrpl: expect.objectContaining({
        network: expect.any(String)
      })
    });
  });
});
