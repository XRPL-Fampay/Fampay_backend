const request = require('supertest');
const app = require('../src/app');

describe('GET /docs', () => {
  it('serves swagger UI', async () => {
    const response = await request(app).get('/docs').redirects(1);
    expect(response.status).toBe(200);
    expect(response.text).toContain('Swagger UI');
  });
});
