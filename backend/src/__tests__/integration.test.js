const request = require('supertest');
const app = require('../server');
const fileUtils = require('../utils/fileUtils');

describe('Testes de Integração - API Endpoints', () => {
  
  beforeEach(async () => {
    // Limpar dados de teste antes de cada teste
    await fileUtils.writeJsonFile('nodes/nodes.json', { version: '1.0', nodes: [] });
  });

  describe('Health Check', () => {
    test('GET /api/health deve retornar status OK', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Nodes API', () => {
    test('GET /api/nodes deve retornar lista vazia inicialmente', async () => {
      const response = await request(app)
        .get('/api/nodes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    test('POST /api/nodes deve criar um novo nó', async () => {
      const newNode = {
        name: 'Nó de Teste',
        description: 'Descrição do nó de teste',
        workflows: ['default'],
        position: { x: 100, y: 200 }
      };

      const response = await request(app)
        .post('/api/nodes')
        .send(newNode)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newNode.name);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.message).toBe('Nó criado com sucesso');
    });

    test('POST /api/nodes deve validar dados obrigatórios', async () => {
      const invalidNode = {
        description: 'Nó sem nome'
      };

      const response = await request(app)
        .post('/api/nodes')
        .send(invalidNode)
        .expect(500);

      expect(response.body.error).toBeDefined();
    });

    test('GET /api/nodes/:id deve retornar nó específico', async () => {
      // Primeiro criar um nó
      const newNode = {
        name: 'Nó para Busca',
        description: 'Nó para teste de busca',
        workflows: ['default'],
        position: { x: 0, y: 0 }
      };

      const createResponse = await request(app)
        .post('/api/nodes')
        .send(newNode);

      const nodeId = createResponse.body.data.id;

      // Buscar o nó criado
      const response = await request(app)
        .get(`/api/nodes/${nodeId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(nodeId);
      expect(response.body.data.name).toBe(newNode.name);
    });

    test('PUT /api/nodes/:id deve atualizar nó existente', async () => {
      // Criar nó
      const newNode = {
        name: 'Nó Original',
        description: 'Descrição original',
        workflows: ['default'],
        position: { x: 0, y: 0 }
      };

      const createResponse = await request(app)
        .post('/api/nodes')
        .send(newNode);

      const nodeId = createResponse.body.data.id;

      // Atualizar nó
      const updateData = {
        name: 'Nó Atualizado',
        description: 'Descrição atualizada'
      };

      const response = await request(app)
        .put(`/api/nodes/${nodeId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    test('DELETE /api/nodes/:id deve deletar nó existente', async () => {
      // Criar nó
      const newNode = {
        name: 'Nó para Deletar',
        description: 'Nó que será deletado',
        workflows: ['default'],
        position: { x: 0, y: 0 }
      };

      const createResponse = await request(app)
        .post('/api/nodes')
        .send(newNode);

      const nodeId = createResponse.body.data.id;

      // Deletar nó
      const response = await request(app)
        .delete(`/api/nodes/${nodeId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Nó deletado com sucesso');

      // Verificar se foi deletado
      await request(app)
        .get(`/api/nodes/${nodeId}`)
        .expect(500); // Deve retornar erro pois nó não existe mais
    });
  });

  describe('Steps API', () => {
    let nodeId;

    beforeEach(async () => {
      // Criar um nó para os testes de etapas
      const newNode = {
        name: 'Nó com Etapas',
        description: 'Nó para teste de etapas',
        workflows: ['default'],
        position: { x: 0, y: 0 }
      };

      const createResponse = await request(app)
        .post('/api/nodes')
        .send(newNode);

      nodeId = createResponse.body.data.id;
    });

    test('POST /api/nodes/:id/steps deve adicionar etapa ao nó', async () => {
      const newStep = {
        type: 'process',
        name: 'Etapa de Processo',
        description: 'Etapa de processamento',
        workflows: ['default'],
        connections: []
      };

      const response = await request(app)
        .post(`/api/nodes/${nodeId}/steps`)
        .send(newStep)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newStep.name);
      expect(response.body.data.type).toBe(newStep.type);
      expect(response.body.message).toBe('Etapa adicionada com sucesso');
    });

    test('PUT /api/nodes/:nodeId/steps/:stepId deve atualizar etapa', async () => {
      // Criar etapa
      const newStep = {
        type: 'process',
        name: 'Etapa Original',
        description: 'Etapa que será atualizada',
        workflows: ['default'],
        connections: []
      };

      const createResponse = await request(app)
        .post(`/api/nodes/${nodeId}/steps`)
        .send(newStep);

      const stepId = createResponse.body.data.id;

      // Atualizar etapa
      const updateData = {
        name: 'Etapa Atualizada',
        description: 'Descrição atualizada'
      };

      const response = await request(app)
        .put(`/api/nodes/${nodeId}/steps/${stepId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.message).toBe('Etapa atualizada com sucesso');
    });

    test('DELETE /api/nodes/:nodeId/steps/:stepId deve remover etapa', async () => {
      // Criar etapa
      const newStep = {
        type: 'end',
        name: 'Etapa Final',
        description: 'Etapa que será removida',
        workflows: ['default'],
        connections: []
      };

      const createResponse = await request(app)
        .post(`/api/nodes/${nodeId}/steps`)
        .send(newStep);

      const stepId = createResponse.body.data.id;

      // Remover etapa
      const response = await request(app)
        .delete(`/api/nodes/${nodeId}/steps/${stepId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Etapa removida com sucesso');
    });
  });

  describe('Search API', () => {
    beforeEach(async () => {
      // Criar alguns nós para teste de busca
      const nodes = [
        {
          name: 'Nó de Desenvolvimento',
          description: 'Nó para ambiente de desenvolvimento',
          workflows: ['default'],
          position: { x: 0, y: 0 }
        },
        {
          name: 'Nó de Produção',
          description: 'Nó para ambiente de produção',
          workflows: ['default'],
          position: { x: 100, y: 100 }
        }
      ];

      for (const node of nodes) {
        await request(app)
          .post('/api/nodes')
          .send(node);
      }
    });

    test('GET /api/search deve buscar nós por nome', async () => {
      const response = await request(app)
        .get('/api/search?q=desenvolvimento')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name.toLowerCase()).toContain('desenvolvimento');
    });

    test('GET /api/search deve buscar nós por descrição', async () => {
      const response = await request(app)
        .get('/api/search?q=produção')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].description.toLowerCase()).toContain('produção');
    });

    test('GET /api/search deve retornar erro sem parâmetro q', async () => {
      const response = await request(app)
        .get('/api/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('obrigatório');
    });
  });

  describe('Properties API', () => {
    test('GET /api/properties/standard deve retornar propriedades padrão', async () => {
      const response = await request(app)
        .get('/api/properties/standard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.properties).toBeDefined();
      expect(Array.isArray(response.body.data.properties)).toBe(true);
    });

    test('POST /api/properties/standard deve atualizar propriedades padrão', async () => {
      const newProperties = {
        version: '1.0',
        properties: [
          {
            key: 'test',
            type: 'text',
            required: false,
            default: ''
          }
        ]
      };

      const response = await request(app)
        .post('/api/properties/standard')
        .send(newProperties)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Propriedades padrão atualizadas com sucesso');
    });
  });

  describe('Workflows API', () => {
    test('GET /api/workflows deve retornar lista de workflows', async () => {
      const response = await request(app)
        .get('/api/workflows')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.workflows).toBeDefined();
      expect(Array.isArray(response.body.data.workflows)).toBe(true);
    });
  });
});
