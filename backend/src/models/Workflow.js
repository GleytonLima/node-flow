const { v4: uuidv4 } = require('uuid');

class Workflow {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.name = data.name || '';
    this.description = data.description || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  validate() {
    const errors = [];

    if (!this.name || this.name.trim() === '') {
      errors.push('Nome do workflow é obrigatório');
    }

    if (this.name && this.name.length > 100) {
      errors.push('Nome do workflow deve ter no máximo 100 caracteres');
    }

    if (this.description && this.description.length > 500) {
      errors.push('Descrição do workflow deve ter no máximo 500 caracteres');
    }

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromJSON(data) {
    return new Workflow(data);
  }
}

module.exports = Workflow;
