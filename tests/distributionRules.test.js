const request = require('supertest');
const jwt = require('jsonwebtoken');

let distributionService;

describe('Distribution Rules API', () => {
  let app;
  let adminToken;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../src/services/distributionRuleService', () => ({
      createRule: jest.fn(),
      listRules: jest.fn(),
      updateRule: jest.fn(),
      deleteRule: jest.fn(),
      getRule: jest.fn()
    }));
    distributionService = require('../src/services/distributionRuleService');
    distributionService.createRule.mockResolvedValue({ id: 'rule-1', name: 'Default', splits: [] });
    distributionService.listRules.mockResolvedValue([{ id: 'rule-1', name: 'Default', splits: [] }]);
    distributionService.updateRule.mockResolvedValue({ id: 'rule-1', name: 'Updated', splits: [] });
    distributionService.deleteRule.mockResolvedValue({ success: true });
    app = require('../src/app');
    adminToken = jwt.sign({ sub: 'admin-user', role: 'ADMIN' }, 'dev-access-secret');
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('creates distribution rule', async () => {
    const response = await request(app)
      .post('/api/groups/group-1/distribution-rules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Default', splits: [{ xrplAddress: 'rDest', percentage: 100 }] });

    expect(response.status).toBe(201);
    expect(distributionService.createRule).toHaveBeenCalledWith({ groupId: 'group-1', name: 'Default', splits: [{ xrplAddress: 'rDest', percentage: 100 }], isActive: undefined });
  });

  it('lists distribution rules', async () => {
    const response = await request(app)
      .get('/api/groups/group-1/distribution-rules')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(distributionService.listRules).toHaveBeenCalledWith('group-1');
  });

  it('updates distribution rule', async () => {
    const response = await request(app)
      .patch('/api/groups/group-1/distribution-rules/rule-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated' });

    expect(response.status).toBe(200);
    expect(distributionService.updateRule).toHaveBeenCalledWith({ ruleId: 'rule-1', name: 'Updated', splits: undefined, isActive: undefined });
  });

  it('deletes distribution rule', async () => {
    const response = await request(app)
      .delete('/api/groups/group-1/distribution-rules/rule-1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(distributionService.deleteRule).toHaveBeenCalledWith('rule-1');
  });
});
