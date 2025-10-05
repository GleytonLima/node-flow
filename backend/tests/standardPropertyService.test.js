const StandardPropertyService = require('../src/services/StandardPropertyService');
const StandardProperty = require('../src/models/StandardProperty');
const fs = require('fs').promises;
const path = require('path');

describe('StandardPropertyService', () => {
  let service;
  let testDataDir;
  let testPropertiesFile;

  beforeEach(() => {
    service = new StandardPropertyService();
    testDataDir = path.join(__dirname, '../test-data');
    testPropertiesFile = path.join(testDataDir, 'standard-properties.json');
    
    // Limpar arquivo de teste se existir
    return fs.unlink(testPropertiesFile).catch(() => {});
  });

  afterEach(() => {
    // Limpar arquivo de teste após cada teste
    return fs.unlink(testPropertiesFile).catch(() => {});
  });

  describe('createProperty', () => {
    it('deve criar uma nova propriedade padrão', async () => {
      const propertyData = {
        name: 'Prioridade',
        description: 'Nível de prioridade da tarefa',
        type: 'select',
        options: ['Baixa', 'Média', 'Alta'],
        required: true,
        defaultValue: 'Média'
      };

      const result = await service.createProperty(propertyData);

      expect(result).toBeInstanceOf(StandardProperty);
      expect(result.name).toBe('Prioridade');
      expect(result.type).toBe('select');
      expect(result.options).toEqual(['Baixa', 'Média', 'Alta']);
      expect(result.required).toBe(true);
    });

    it('deve rejeitar propriedade com nome duplicado', async () => {
      const propertyData1 = {
        name: 'Status',
        type: 'text'
      };

      const propertyData2 = {
        name: 'Status',
        type: 'select',
        options: ['Ativo', 'Inativo']
      };

      await service.createProperty(propertyData1);

      await expect(service.createProperty(propertyData2))
        .rejects.toThrow('Já existe uma propriedade padrão com este nome');
    });

    it('deve validar dados obrigatórios', async () => {
      const propertyData = {
        name: '', // Nome vazio
        type: 'invalid-type'
      };

      await expect(service.createProperty(propertyData))
        .rejects.toThrow('Erro de validação');
    });
  });

  describe('getAllProperties', () => {
    it('deve retornar array vazio quando não há propriedades', async () => {
      const result = await service.getAllProperties();
      expect(result).toEqual([]);
    });

    it('deve retornar todas as propriedades cadastradas', async () => {
      const property1 = {
        name: 'Prioridade',
        type: 'select',
        options: ['Baixa', 'Média', 'Alta']
      };

      const property2 = {
        name: 'Status',
        type: 'text'
      };

      await service.createProperty(property1);
      await service.createProperty(property2);

      const result = await service.getAllProperties();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Prioridade');
      expect(result[1].name).toBe('Status');
    });
  });

  describe('getPropertyById', () => {
    it('deve retornar propriedade por ID', async () => {
      const propertyData = {
        name: 'Prioridade',
        type: 'select',
        options: ['Baixa', 'Média', 'Alta']
      };

      const created = await service.createProperty(propertyData);
      const result = await service.getPropertyById(created.id);

      expect(result).toBeInstanceOf(StandardProperty);
      expect(result.id).toBe(created.id);
      expect(result.name).toBe('Prioridade');
    });

    it('deve retornar undefined para ID inexistente', async () => {
      const result = await service.getPropertyById('inexistente');
      expect(result).toBeUndefined();
    });
  });

  describe('updateProperty', () => {
    it('deve atualizar propriedade existente', async () => {
      const propertyData = {
        name: 'Prioridade',
        type: 'select',
        options: ['Baixa', 'Média', 'Alta']
      };

      const created = await service.createProperty(propertyData);
      
      const updateData = {
        name: 'Prioridade Atualizada',
        description: 'Nova descrição'
      };

      const result = await service.updateProperty(created.id, updateData);

      expect(result.name).toBe('Prioridade Atualizada');
      expect(result.description).toBe('Nova descrição');
      expect(result.type).toBe('select'); // Deve manter valores não atualizados
    });

    it('deve rejeitar atualização com nome duplicado', async () => {
      const property1 = {
        name: 'Status',
        type: 'text'
      };

      const property2 = {
        name: 'Prioridade',
        type: 'select',
        options: ['Baixa', 'Média', 'Alta']
      };

      const created1 = await service.createProperty(property1);
      const created2 = await service.createProperty(property2);

      const updateData = {
        name: 'Status' // Tentar usar nome da primeira propriedade
      };

      await expect(service.updateProperty(created2.id, updateData))
        .rejects.toThrow('Já existe uma propriedade padrão com este nome');
    });

    it('deve rejeitar atualização de propriedade inexistente', async () => {
      const updateData = {
        name: 'Inexistente'
      };

      await expect(service.updateProperty('inexistente', updateData))
        .rejects.toThrow('Propriedade padrão não encontrada');
    });
  });

  describe('deleteProperty', () => {
    it('deve excluir propriedade existente', async () => {
      const propertyData = {
        name: 'Prioridade',
        type: 'select',
        options: ['Baixa', 'Média', 'Alta']
      };

      const created = await service.createProperty(propertyData);
      const result = await service.deleteProperty(created.id);

      expect(result).toBeInstanceOf(StandardProperty);
      expect(result.id).toBe(created.id);

      // Verificar se foi realmente excluída
      const allProperties = await service.getAllProperties();
      expect(allProperties).toHaveLength(0);
    });

    it('deve rejeitar exclusão de propriedade inexistente', async () => {
      await expect(service.deleteProperty('inexistente'))
        .rejects.toThrow('Propriedade padrão não encontrada');
    });
  });
});


