const fs = require('fs').promises;
const path = require('path');

class FileUtils {
  constructor() {
    // Detectar se estamos no Docker ou localmente
    const isDocker = process.cwd() === '/app';
    
    if (isDocker) {
      // No Docker: /app/src/utils/fileUtils.js -> /app/data
      this.dataPath = process.env.TEST_DATA_PATH || path.join(__dirname, '../../data');
    } else {
      // Localmente: backend/src/utils/fileUtils.js -> data/
      this.dataPath = process.env.TEST_DATA_PATH || path.join(__dirname, '../../../data');
    }
    
    console.log('FileUtils - isDocker:', isDocker, 'dataPath:', this.dataPath);
  }

  async readJsonFile(filePath) {
    try {
      const fullPath = path.join(this.dataPath, filePath);
      const data = await fs.readFile(fullPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
      }
      if (error instanceof SyntaxError) {
        throw new Error(`JSON inválido no arquivo: ${filePath}`);
      }
      throw error;
    }
  }

  async writeJsonFile(filePath, data) {
    try {
      const fullPath = path.join(this.dataPath, filePath);
      const dir = path.dirname(fullPath);
      
      // Criar diretório se não existir
      await fs.mkdir(dir, { recursive: true });
      
      // Escrever arquivo com formatação
      await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      throw new Error(`Erro ao escrever arquivo ${filePath}: ${error.message}`);
    }
  }

  async fileExists(filePath) {
    try {
      const fullPath = path.join(this.dataPath, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async ensureDirectory(dirPath) {
    const fullPath = path.join(this.dataPath, dirPath);
    await fs.mkdir(fullPath, { recursive: true });
  }

  // Métodos específicos para os arquivos do sistema
  async getNodes() {
    return await this.readJsonFile('nodes/nodes.json');
  }

  async saveNodes(nodesData) {
    return await this.writeJsonFile('nodes/nodes.json', nodesData);
  }

  async getStandardProperties() {
    return await this.readJsonFile('properties/standard-properties.json');
  }

  async saveStandardProperties(propertiesData) {
    return await this.writeJsonFile('properties/standard-properties.json', propertiesData);
  }

  async getWorkflows() {
    return await this.readJsonFile('workflows/workflows.json');
  }

  async saveWorkflows(workflowsData) {
    return await this.writeJsonFile('workflows/workflows.json', workflowsData);
  }

  async getAppConfig() {
    return await this.readJsonFile('config/app-config.json');
  }
}

const fileUtilsInstance = new FileUtils();
module.exports = fileUtilsInstance;
