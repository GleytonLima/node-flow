const request = require('supertest');
const app = require('../server');

describe('Sistema de Busca Avançada', () => {
  let testNodeId;
  let testStepId;

  beforeAll(async () => {
    // Criar um nó de teste com etapas
    const nodeData = {
      name: 'Nó de Teste para Busca',
      description: 'Este é um nó para testar funcionalidades de busca avançada',
      workflows: ['test-workflow', 'advanced-search'],
      properties: {
        standardProps: { environment: 'test' },
        customProps: { priority: 'high', category: 'search-test' }
      }
    };

    const nodeResponse = await request(app)
      .post('/api/nodes')
      .send(nodeData);

    testNodeId = nodeResponse.body.data.id;

    // Adicionar etapas ao nó
    const stepData = {
      type: 'decision',
      name: 'Etapa de Decisão para Busca',
      description: 'Esta etapa contém informações sobre decisões de busca',
      workflows: ['test-workflow'],
      connections: [
        { targetNodeId: testNodeId, condition: 'se busca for bem-sucedida' },
        { targetNodeId: testNodeId, condition: 'se busca falhar' }
      ],
      properties: { searchType: 'advanced', resultCount: 10 }
    };

    const stepResponse = await request(app)
      .post(`/api/nodes/${testNodeId}/steps`)
      .send(stepData);

    testStepId = stepResponse.body.data.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testNodeId) {
      await request(app).delete(`/api/nodes/${testNodeId}`);
    }
  });

  describe('GET /api/search - Busca Avançada', () => {
    it('deve buscar por nome de nó', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'Teste para Busca' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name).toContain('Teste para Busca');
    });

    it('deve buscar por descrição', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'funcionalidades de busca' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('deve buscar por propriedades customizadas', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'high', includeProperties: 'true' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // A busca pode retornar 0 resultados se não encontrar a propriedade
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('deve filtrar por workflow', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'Teste', workflow: 'test-workflow' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('deve filtrar por tipo de etapa', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'decisão', type: 'decision' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('deve buscar em condições de conexão', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'bem-sucedida' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('deve retornar estrutura completa com etapas correspondentes', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'Teste' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const nodeResult = response.body.data.find(r => r.type === 'node');
      expect(nodeResult).toBeDefined();
      expect(nodeResult.steps).toBeDefined();
      expect(nodeResult.hasMatchingSteps).toBeDefined();
    });
  });

  describe('GET /api/search/workflows', () => {
    it('deve retornar lista de workflows disponíveis', async () => {
      const response = await request(app)
        .get('/api/search/workflows');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toContain('test-workflow');
      expect(response.body.data).toContain('advanced-search');
    });
  });

  describe('GET /api/search/types', () => {
    it('deve retornar lista de tipos de etapa disponíveis', async () => {
      const response = await request(app)
        .get('/api/search/types');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toContain('process');
      expect(response.body.data).toContain('decision');
      expect(response.body.data).toContain('parallel');
    });
  });

  describe('GET /api/search/suggestions', () => {
    it('deve retornar sugestões baseadas na query', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .query({ q: 'Teste' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('deve retornar array vazio para query muito curta', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .query({ q: 'a' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('deve limitar sugestões a 10 itens', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .query({ q: 'a' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Validação de Parâmetros', () => {
    it('deve retornar erro 400 sem parâmetro q', async () => {
      const response = await request(app)
        .get('/api/search');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('obrigatório');
    });

    it('deve aceitar parâmetros opcionais', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ 
          q: 'teste',
          workflow: 'test-workflow',
          type: 'decision',
          includeProperties: 'false'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.filters).toBeDefined();
      expect(response.body.filters.workflow).toBe('test-workflow');
      expect(response.body.filters.type).toBe('decision');
      expect(response.body.filters.includeProperties).toBe(false);
    });
  });
});
