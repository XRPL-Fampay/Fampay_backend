const request = require('supertest');

const mockGroup = { id: 'group-1' };
const mockDomain = {
  id: 'domain-1',
  groupId: 'group-1',
  domain: 'gateway.example',
  label: 'Sample',
  verifiedAt: null
};

const prismaMock = {
  group: {
    findUnique: jest.fn(async () => mockGroup)
  },
  permissionedDomain: {
    create: jest.fn(async () => mockDomain),
    findMany: jest.fn(async () => [mockDomain]),
    update: jest.fn(async () => ({ ...mockDomain, verifiedAt: new Date().toISOString() })),
    delete: jest.fn(async () => mockDomain)
  }
};

describe('Permissioned Domains API', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.doMock('../src/db/prisma', () => ({ prisma: prismaMock }));
    app = require('../src/app');
  });

  it('creates permissioned domain', async () => {
    const response = await request(app)
      .post('/api/groups/group-1/permissioned-domains')
      .send({ domain: 'gateway.example' });

    expect(response.status).toBe(201);
    expect(prismaMock.permissionedDomain.create).toHaveBeenCalled();
    expect(response.body.domain).toBe('gateway.example');
  });

  it('lists permissioned domains', async () => {
    const response = await request(app)
      .get('/api/groups/group-1/permissioned-domains');

    expect(response.status).toBe(200);
    expect(prismaMock.permissionedDomain.findMany).toHaveBeenCalled();
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('verifies permissioned domain', async () => {
    const response = await request(app)
      .patch('/api/groups/group-1/permissioned-domains/domain-1/verify')
      .send({ verified: true });

    expect(response.status).toBe(200);
    expect(prismaMock.permissionedDomain.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'domain-1' }
    }));
  });

  it('deletes permissioned domain', async () => {
    const response = await request(app)
      .delete('/api/groups/group-1/permissioned-domains/domain-1');

    expect(response.status).toBe(200);
    expect(prismaMock.permissionedDomain.delete).toHaveBeenCalledWith({ where: { id: 'domain-1' } });
    expect(response.body).toEqual({ success: true });
  });
});
