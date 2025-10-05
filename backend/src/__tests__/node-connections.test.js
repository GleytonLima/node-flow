const request = require('supertest');
const app = require('../server');

describe('Node Connections API', () => {
  let testNodeId;

  beforeAll(async () => {
    // Criar um nó de teste com etapas e conexões
    const nodeData = {
      name: 'Nó Teste Conexões',
      description: 'Nó para testar conexões',
      workflows: ['test'],
      properties: {
        standardProps: {},
        customProps: {}
      },
      steps: [
        {
          id: 'step1',
          name: 'Etapa 1',
          description: 'Primeira etapa',
          type: 'process',
          workflows: ['test'],
          connections: [
            {
              targetNodeId: 'target-node-id', // Será atualizado após criar o nó alvo
              condition: 'Se condição A',
              type: 'success'
            }
          ],
          properties: {}
        }
      ]
    };

    const response = await request(app)
      .post('/api/nodes')
      .send(nodeData);

    testNodeId = response.body.data.id;

    // Criar nó alvo
    const targetNodeData = {
      name: 'Nó Alvo',
      description: 'Nó de destino',
      workflows: ['test'],
      properties: {
        standardProps: {},
        customProps: {}
      },
      steps: []
    };

    const targetResponse = await request(app)
      .post('/api/nodes')
      .send(targetNodeData);

    const targetNodeId = targetResponse.body.data.id;

    // Atualizar conexão com ID real
    const updatedStep = {
      ...nodeData.steps[0],
      connections: [
        {
          targetNodeId: targetNodeId,
          condition: 'Se condição A',
          type: 'success'
        }
      ]
    };

    await request(app)
      .put(`/api/nodes/${testNodeId}/steps/${nodeData.steps[0].id}`)
      .send(updatedStep);
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testNodeId) {
      await request(app).delete(`/api/nodes/${testNodeId}`);
    }
  });

  describe('GET /api/nodes/:id/connections', () => {
    it('deve retornar conexões de um nó', async () => {
      const response = await request(app)
        .get(`/api/nodes/${testNodeId}/connections`)
        .query({ maxDepth: 5 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.maxDepth).toBe(5);
    });

    it('deve retornar erro para nó inexistente', async () => {
      const response = await request(app)
        .get('/api/nodes/inexistente/connections');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('deve respeitar o limite de profundidade', async () => {
      const response = await request(app)
        .get(`/api/nodes/${testNodeId}/connections`)
        .query({ maxDepth: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.maxDepth).toBe(1);
    });

    it('deve usar profundidade padrão se não especificada', async () => {
      const response = await request(app)
        .get(`/api/nodes/${testNodeId}/connections`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.maxDepth).toBe(10);
    });
  });
});
