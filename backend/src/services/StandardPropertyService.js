const fs = require('fs').promises;
const path = require('path');
const StandardProperty = require('../models/StandardProperty');

class StandardPropertyService {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.propertiesFile = path.join(this.dataDir, 'standard-properties.json');
    this.ensureDataDirectory();
  }

  async ensureDataDirectory() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      console.error('Erro ao criar diretório de dados:', error);
    }
  }

  async loadProperties() {
    try {
      const data = await fs.readFile(this.propertiesFile, 'utf8');
      const propertiesData = JSON.parse(data);
      return propertiesData.map(prop => StandardProperty.fromJSON(prop));
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Arquivo não existe, retornar array vazio
        return [];
      }
      throw new Error(`Erro ao carregar propriedades padrão: ${error.message}`);
    }
  }

  async saveProperties(properties) {
    try {
      const data = JSON.stringify(properties.map(prop => prop.toJSON()), null, 2);
      await fs.writeFile(this.propertiesFile, data, 'utf8');
    } catch (error) {
      throw new Error(`Erro ao salvar propriedades padrão: ${error.message}`);
    }
  }

  async getAllProperties() {
    return await this.loadProperties();
  }

  async getPropertyById(id) {
    const properties = await this.loadProperties();
    return properties.find(prop => prop.id === id);
  }

  async createProperty(propertyData) {
    const properties = await this.loadProperties();
    
    // Verificar se já existe propriedade com o mesmo nome
    const existingProperty = properties.find(prop => 
      prop.name.toLowerCase() === propertyData.name.toLowerCase()
    );
    
    if (existingProperty) {
      throw new Error('Já existe uma propriedade padrão com este nome');
    }

    const newProperty = new StandardProperty(propertyData);
    const validationErrors = newProperty.validate();
    
    if (validationErrors.length > 0) {
      throw new Error(`Erro de validação: ${validationErrors.join(', ')}`);
    }

    properties.push(newProperty);
    await this.saveProperties(properties);
    
    return newProperty;
  }

  async updateProperty(id, propertyData) {
    const properties = await this.loadProperties();
    const propertyIndex = properties.findIndex(prop => prop.id === id);
    
    if (propertyIndex === -1) {
      throw new Error('Propriedade padrão não encontrada');
    }

    // Verificar se já existe outra propriedade com o mesmo nome
    const existingProperty = properties.find(prop => 
      prop.id !== id && prop.name.toLowerCase() === propertyData.name.toLowerCase()
    );
    
    if (existingProperty) {
      throw new Error('Já existe uma propriedade padrão com este nome');
    }

    const updatedProperty = new StandardProperty({
      ...properties[propertyIndex].toJSON(),
      ...propertyData,
      id: id, // Manter o ID original
      updatedAt: new Date().toISOString()
    });

    const validationErrors = updatedProperty.validate();
    
    if (validationErrors.length > 0) {
      throw new Error(`Erro de validação: ${validationErrors.join(', ')}`);
    }

    properties[propertyIndex] = updatedProperty;
    await this.saveProperties(properties);
    
    return updatedProperty;
  }

  async deleteProperty(id) {
    const properties = await this.loadProperties();
    const propertyIndex = properties.findIndex(prop => prop.id === id);
    
    if (propertyIndex === -1) {
      throw new Error('Propriedade padrão não encontrada');
    }

    // Verificar se a propriedade está sendo usada em algum nó
    const isUsed = await this.isPropertyUsed(id);
    if (isUsed) {
      throw new Error('Não é possível excluir propriedade que está sendo usada em nós');
    }

    const deletedProperty = properties[propertyIndex];
    properties.splice(propertyIndex, 1);
    await this.saveProperties(properties);
    
    return deletedProperty;
  }

  async isPropertyUsed(propertyId) {
    try {
      const NodeService = require('./NodeService');
      const nodeService = new NodeService();
      const nodes = await nodeService.getAllNodes();
      
      return nodes.some(node => {
        if (node.properties && node.properties.standardProps) {
          return Object.keys(node.properties.standardProps).includes(propertyId);
        }
        return false;
      });
    } catch (error) {
      console.error('Erro ao verificar uso da propriedade:', error);
      return false;
    }
  }

  async getPropertyUsage(propertyId) {
    try {
      const NodeService = require('./NodeService');
      const nodeService = new NodeService();
      const nodes = await nodeService.getAllNodes();
      
      const usage = [];
      nodes.forEach(node => {
        if (node.properties && node.properties.standardProps) {
          if (Object.keys(node.properties.standardProps).includes(propertyId)) {
            usage.push({
              nodeId: node.id,
              nodeName: node.name,
              value: node.properties.standardProps[propertyId]
            });
          }
        }
      });
      
      return usage;
    } catch (error) {
      console.error('Erro ao obter uso da propriedade:', error);
      return [];
    }
  }
}

module.exports = StandardPropertyService;


