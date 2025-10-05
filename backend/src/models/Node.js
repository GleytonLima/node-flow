const { v4: uuidv4 } = require('uuid');

class Node {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.name = data.name || '';
    this.description = data.description || '';
    this.workflows = data.workflows || ['default'];
    this.properties = {
      standardProps: data.properties?.standardProps || {},
      customProps: data.properties?.customProps || {}
    };
    // Position removed - layout is handled by frontend
    this.steps = data.steps || [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Validações
  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Nome é obrigatório');
    }

    if (!Array.isArray(this.workflows)) {
      errors.push('Workflows deve ser um array');
    }

    // Position validation removed - layout is handled by frontend

    if (!Array.isArray(this.steps)) {
      errors.push('Steps deve ser um array');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Métodos de manipulação
  addStep(step) {
    this.steps.push(step);
    this.updatedAt = new Date().toISOString();
  }

  removeStep(stepId) {
    this.steps = this.steps.filter(step => step.id !== stepId);
    this.updatedAt = new Date().toISOString();
  }

  updateStep(stepId, stepData) {
    const stepIndex = this.steps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      this.steps[stepIndex] = { ...this.steps[stepIndex], ...stepData };
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

  // Serialização
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      workflows: this.workflows,
      properties: this.properties,
      // position removed
      steps: this.steps,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Criação a partir de dados
  static fromJSON(data) {
    return new Node(data);
  }
}

module.exports = Node;
