const fs = require('fs').promises;
const path = require('path');

// Configurar ambiente de teste
process.env.NODE_ENV = 'test';

// Criar diretório temporário para dados de teste
const testDataPath = path.join(__dirname, '../../test-data');

beforeAll(async () => {
  // Criar diretório de dados de teste
  await fs.mkdir(testDataPath, { recursive: true });
  await fs.mkdir(path.join(testDataPath, 'nodes'), { recursive: true });
  await fs.mkdir(path.join(testDataPath, 'properties'), { recursive: true });
  await fs.mkdir(path.join(testDataPath, 'workflows'), { recursive: true });
  await fs.mkdir(path.join(testDataPath, 'config'), { recursive: true });

  // Criar arquivos JSON iniciais
  await fs.writeFile(
    path.join(testDataPath, 'nodes/nodes.json'),
    JSON.stringify({ version: '1.0', nodes: [] }, null, 2)
  );

  await fs.writeFile(
    path.join(testDataPath, 'properties/standard-properties.json'),
    JSON.stringify({
      version: '1.0',
      properties: [
        {
          key: 'environment',
          type: 'select',
          options: ['dev', 'staging', 'prod'],
          required: true,
          default: 'dev'
        }
      ]
    }, null, 2)
  );

  await fs.writeFile(
    path.join(testDataPath, 'workflows/workflows.json'),
    JSON.stringify({
      version: '1.0',
      workflows: [
        {
          id: 'default',
          name: 'Workflow Padrão',
          description: 'Workflow padrão para novos nós'
        }
      ]
    }, null, 2)
  );

  await fs.writeFile(
    path.join(testDataPath, 'config/app-config.json'),
    JSON.stringify({
      version: '1.0',
      app: {
        name: 'Resources Manager',
        version: '1.0.0'
      }
    }, null, 2)
  );
});

afterAll(async () => {
  // Limpar dados de teste
  try {
    await fs.rm(testDataPath, { recursive: true, force: true });
  } catch (error) {
    console.warn('Erro ao limpar dados de teste:', error.message);
  }
});

// Configurar variável de ambiente para dados de teste
process.env.TEST_DATA_PATH = path.join(__dirname, '../../test-data');
