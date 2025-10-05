const request = require('supertest');
const app = require('../server');
const fileUtils = require('../utils/fileUtils');

describe('Workflows API', () => {
  let testWorkflowId;

  beforeAll(async () => {
    // Limpar workflows existentes para testes
    const workflows = await fileUtils.getWorkflows();
    workflows.workflows = workflows.workflows.filter(w => w.id === 'default');
    await fileUtils.saveWorkflows(workflows);
  });

  afterAll(async () => {
    // Limpar workflows de teste
    const workflows = await fileUtils.getWorkflows();
    workflows.workflows = workflows.workflows.filter(w => w.id === 'default');
    await fileUtils.saveWorkflows(workflows);
  });

  describe('GET /api/workflows', () => {
    it('deve retornar lista de workflows', async () => {
      const response = await request(app)
        .get('/api/workflows')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeDefined();
    });
  });

  describe('POST /api/workflows', () => {
    it('deve criar novo workflow', async () => {
      const workflowData = {
        name: 'Teste Workflow',
        description: 'Workflow para testes'
      };

      const response = await request(app)
        .post('/api/workflows')
        .send(workflowData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(workflowData.name);
      expect(response.body.data.description).toBe(workflowData.description);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.message).toBe('Workflow criado com sucesso');

      testWorkflowId = response.body.data.id;
    });

    it('deve falhar ao criar workflow sem nome', async () => {
      const workflowData = {
        description: 'Workflow sem nome'
      };

      const response = await request(app)
        .post('/api/workflows')
        .send(workflowData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('deve falhar ao criar workflow com nome duplicado', async () => {
      const workflowData = {
        name: 'Teste Workflow',
        description: 'Workflow duplicado'
      };

      const response = await request(app)
        .post('/api/workflows')
        .send(workflowData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/workflows/:id', () => {
    it('deve retornar workflow por ID', async () => {
      const response = await request(app)
        .get(`/api/workflows/${testWorkflowId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testWorkflowId);
      expect(response.body.data.name).toBe('Teste Workflow');
    });

    it('deve falhar ao buscar workflow inexistente', async () => {
      const response = await request(app)
        .get('/api/workflows/inexistente')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/workflows/:id', () => {
    it('deve atualizar workflow', async () => {
      const updateData = {
        name: 'Teste Workflow Atualizado',
        description: 'Descrição atualizada'
      };

      const response = await request(app)
        .put(`/api/workflows/${testWorkflowId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.message).toBe('Workflow atualizado com sucesso');
    });

    it('deve falhar ao atualizar workflow inexistente', async () => {
      const updateData = {
        name: 'Nome Atualizado'
      };

      const response = await request(app)
        .put('/api/workflows/inexistente')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/workflows/:id/usage', () => {
    it('deve retornar informações de uso do workflow', async () => {
      const response = await request(app)
        .get(`/api/workflows/${testWorkflowId}/usage`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.usedInNodes).toBeDefined();
      expect(response.body.data.usedInSteps).toBeDefined();
      expect(Array.isArray(response.body.data.nodeDetails)).toBe(true);
      expect(Array.isArray(response.body.data.stepDetails)).toBe(true);
    });
  });

  describe('DELETE /api/workflows/:id', () => {
    it('deve deletar workflow', async () => {
      const response = await request(app)
        .delete(`/api/workflows/${testWorkflowId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testWorkflowId);
      expect(response.body.message).toBe('Workflow deletado com sucesso');
    });

    it('deve falhar ao deletar workflow inexistente', async () => {
      const response = await request(app)
        .delete('/api/workflows/inexistente')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
