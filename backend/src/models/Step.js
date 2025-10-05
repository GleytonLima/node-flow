const { v4: uuidv4 } = require('uuid');

class Step {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.type = data.type || 'process';
    this.name = data.name || '';
    this.description = data.description || '';
    this.workflows = data.workflows || [];
    this.connections = data.connections || [];
    this.properties = data.properties || {};
    this.decisionStepId = data.decisionStepId || null; // Para etapas condicionais
    // Position removed - layout is handled by frontend
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Validações
  validate() {
    const errors = [];
    const validTypes = ['start', 'end', 'decision', 'parallel', 'process', 'conditional'];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Nome é obrigatório');
    }

    if (!validTypes.includes(this.type)) {
      errors.push(`Tipo deve ser um dos seguintes: ${validTypes.join(', ')}`);
    }

    if (!Array.isArray(this.workflows)) {
      errors.push('Workflows deve ser um array');
    }

    if (!Array.isArray(this.connections)) {
      errors.push('Connections deve ser um array');
    }

    // Validações específicas por tipo
    if (this.type === 'conditional' && !this.decisionStepId) {
      errors.push('Etapas condicionais devem estar associadas a uma etapa de decisão');
    }

    if (this.type === 'start' && this.connections.length === 0) {
      errors.push('Etapas de início devem ter pelo menos 1 conexão');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Métodos de manipulação
  addConnection(connection) {
    const existingConnection = this.connections.find(
      conn => conn.targetNodeId === connection.targetNodeId
    );
    
    if (!existingConnection) {
      this.connections.push(connection);
      this.updatedAt = new Date().toISOString();
    }
  }

  removeConnection(targetNodeId) {
    this.connections = this.connections.filter(
      conn => conn.targetNodeId !== targetNodeId
    );
    this.updatedAt = new Date().toISOString();
  }

  updateConnection(targetNodeId, connectionData) {
    const connectionIndex = this.connections.findIndex(
      conn => conn.targetNodeId === targetNodeId
    );
    
    if (connectionIndex !== -1) {
      this.connections[connectionIndex] = {
        ...this.connections[connectionIndex],
        ...connectionData
      };
      this.updatedAt = new Date().toISOString();
    }
  }

  addWorkflow(workflow) {
    if (!this.workflows.includes(workflow)) {
      this.workflows.push(workflow);
      this.updatedAt = new Date().toISOString();
    }
  }

  removeWorkflow(workflow) {
    this.workflows = this.workflows.filter(w => w !== workflow);
    this.updatedAt = new Date().toISOString();
  }

  // Verificar se é uma etapa terminal
  isTerminal() {
    return this.type === 'end' || this.connections.length === 0;
  }

  // Verificar se é uma etapa inicial
  isInitial() {
    return this.type === 'start';
  }

  // Serialização
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      description: this.description,
      workflows: this.workflows,
      connections: this.connections,
      properties: this.properties,
      decisionStepId: this.decisionStepId,
      // position removed
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Criação a partir de dados
  static fromJSON(data) {
    return new Step(data);
  }
}

module.exports = Step;
