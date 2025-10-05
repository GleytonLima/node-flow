const request = require('supertest');
const app = require('../src/server');
const fs = require('fs').promises;
const path = require('path');

describe('Standard Property Routes', () => {
  const testDataDir = path.join(__dirname, '../test-data');
  const testPropertiesFile = path.join(testDataDir, 'standard-properties.json');

  beforeEach(async () => {
    // Limpar arquivo de teste se existir
    try {
      await fs.unlink(testPropertiesFile);
    } catch (error) {
      // Arquivo não existe, continuar
    }
  });

  afterEach(async () => {
    // Limpar arquivo de teste após cada teste
    try {
      await fs.unlink(testPropertiesFile);
    } catch (error) {
      // Arquivo não existe, continuar
    }
  });

  describe('GET /api/standard-properties', () => {
    it('deve retornar lista vazia quando não há propriedades', async () => {
      const response = await request(app)
        .get('/api/standard-properties')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('deve retornar todas as propriedades cadastradas', async () => {
      // Criar propriedades de teste
      const property1 = {
        name: 'Prioridade',
        description: 'Nível de prioridade',
        type: 'select',
        options: ['Baixa', 'Média', 'Alta'],
        required: true,
        defaultValue: 'Média'
      };

      const property2 = {
        name: 'Status',
        description: 'Status da tarefa',
        type: 'text',
        required: false
      };

      await request(app)
        .post('/api/standard-properties')
        .send(property1)
        .expect(201);

      await request(app)
        .post('/api/standard-properties')
        .send(property2)
        .expect(201);

      const response = await request(app)
        .get('/api/standard-properties')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(2);
    });
  });

  describe('POST /api/standard-properties', () => {
    it('deve criar nova propriedade padrão', async () => {
      const propertyData = {
        name: 'Prioridade',
        description: 'Nível de prioridade da tarefa',
        type: 'select',
        options: ['Baixa', 'Média', 'Alta'],
        required: true,
        defaultValue: 'Média'
      };

      const response = await request(app)
        .post('/api/standard-properties')
        .send(propertyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Prioridade');
      expect(response.body.data.type).toBe('select');
      expect(response.body.data.options).toEqual(['Baixa', 'Média', 'Alta']);
      expect(response.body.data.required).toBe(true);
      expect(response.body.message).toBe('Propriedade padrão criada com sucesso');
    });

    it('deve rejeitar propriedade com nome duplicado', async () => {
      const propertyData = {
        name: 'Status',
        type: 'text'
      };

      // Criar primeira propriedade
      await request(app)
        .post('/api/standard-properties')
        .send(propertyData)
        .expect(201);

      // Tentar criar segunda propriedade com mesmo nome
      const response = await request(app)
        .post('/api/standard-properties')
        .send(propertyData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Já existe uma propriedade padrão com este nome');
    });

    it('deve validar dados obrigatórios', async () => {
      const propertyData = {
        name: '', // Nome vazio
        type: 'invalid-type'
      };

      const response = await request(app)
        .post('/api/standard-properties')
        .send(propertyData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Erro de validação');
    });
  });

  describe('GET /api/standard-properties/:id', () => {
    it('deve retornar propriedade por ID', async () => {
      const propertyData = {
        name: 'Prioridade',
        type: 'select',
        options: ['Baixa', 'Média', 'Alta']
      };

      const createResponse = await request(app)
        .post('/api/standard-properties')
        .send(propertyData)
        .expect(201);

      const propertyId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/standard-properties/${propertyId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(propertyId);
      expect(response.body.data.name).toBe('Prioridade');
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const response = await request(app)
        .get('/api/standard-properties/inexistente')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Propriedade padrão não encontrada');
    });
  });

  describe('PUT /api/standard-properties/:id', () => {
    it('deve atualizar propriedade existente', async () => {
      const propertyData = {
        name: 'Prioridade',
        type: 'select',
        options: ['Baixa', 'Média', 'Alta']
      };

      const createResponse = await request(app)
        .post('/api/standard-properties')
        .send(propertyData)
        .expect(201);

      const propertyId = createResponse.body.data.id;

      const updateData = {
        name: 'Prioridade Atualizada',
        description: 'Nova descrição'
      };

      const response = await request(app)
        .put(`/api/standard-properties/${propertyId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Prioridade Atualizada');
      expect(response.body.data.description).toBe('Nova descrição');
      expect(response.body.message).toBe('Propriedade padrão atualizada com sucesso');
    });

    it('deve rejeitar atualização de propriedade inexistente', async () => {
      const updateData = {
        name: 'Inexistente'
      };

      const response = await request(app)
        .put('/api/standard-properties/inexistente')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Propriedade padrão não encontrada');
    });
  });

  describe('DELETE /api/standard-properties/:id', () => {
    it('deve excluir propriedade existente', async () => {
      const propertyData = {
        name: 'Prioridade',
        type: 'select',
        options: ['Baixa', 'Média', 'Alta']
      };

      const createResponse = await request(app)
        .post('/api/standard-properties')
        .send(propertyData)
        .expect(201);

      const propertyId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/standard-properties/${propertyId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(propertyId);
      expect(response.body.message).toBe('Propriedade padrão excluída com sucesso');

      // Verificar se foi realmente excluída
      await request(app)
        .get(`/api/standard-properties/${propertyId}`)
        .expect(404);
    });

    it('deve rejeitar exclusão de propriedade inexistente', async () => {
      const response = await request(app)
        .delete('/api/standard-properties/inexistente')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Propriedade padrão não encontrada');
    });
  });
});


