const request = require('supertest');
const jwt = require('jsonwebtoken');

const mockDomain = {
  id: 'domain-1',
  groupId: 'group-1',
  domain: 'gateway.example',
  label: 'Sample',
  verifiedAt: null
};

const prismaMock = {
  permissionedDomain: {
    upsert: jest.fn(async () => mockDomain),
    findMany: jest.fn(async () => [mockDomain]),
    update: jest.fn(async () => ({ ...mockDomain, verifiedAt: new Date().toISOString() })),
    delete: jest.fn(async () => mockDomain)
  },
  approvedGateway: {
    upsert: jest.fn()
  }
};

describe('Permissioned Domains API', () => {
  let app;
  let adminToken;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.doMock('../src/db/prisma', () => ({ prisma: prismaMock }));
    app = require('../src/app');
    adminToken = jwt.sign({ sub: 'admin-user', role: 'ADMIN' }, 'dev-access-secret');
  });

  it('creates permissioned domain', async () => {
    const response = await request(app)
      .post('/api/cashout/setup-domains')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ groupId: 'group-1', domain: 'gateway.example' });

    expect(response.status).toBe(201);
    expect(prismaMock.permissionedDomain.upsert).toHaveBeenCalled();
    expect(response.body.domain).toBe('gateway.example');
  });

  it('lists permissioned domains', async () => {
    const response = await request(app)
      .get('/api/cashout/domains')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ groupId: 'group-1' });

    expect(response.status).toBe(200);
    expect(prismaMock.permissionedDomain.findMany).toHaveBeenCalled();
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('verifies permissioned domain', async () => {
    const response = await request(app)
      .patch('/api/cashout/domains/domain-1/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ groupId: 'group-1', verified: true });

    expect(response.status).toBe(200);
    expect(prismaMock.permissionedDomain.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'domain-1' }
    }));
  });

  it('deletes permissioned domain', async () => {
    const response = await request(app)
      .delete('/api/cashout/domains/domain-1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(prismaMock.permissionedDomain.delete).toHaveBeenCalledWith({ where: { id: 'domain-1' } });
    expect(response.body).toEqual({ success: true });
  });
});
