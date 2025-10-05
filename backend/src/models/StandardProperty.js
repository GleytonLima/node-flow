/**
 * Modelo para Propriedades Padrão
 * Representa propriedades pré-cadastradas que podem ser usadas em nós
 */
class StandardProperty {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.name = data.name || '';
    this.description = data.description || '';
    this.type = data.type || 'text'; // text, number, boolean, date, select
    this.options = data.options || []; // Para tipo 'select'
    this.required = data.required || false;
    this.defaultValue = data.defaultValue || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  generateId() {
    return 'prop_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Nome é obrigatório');
    }

    if (this.name && this.name.length > 100) {
      errors.push('Nome deve ter no máximo 100 caracteres');
    }

    if (this.description && this.description.length > 500) {
      errors.push('Descrição deve ter no máximo 500 caracteres');
    }

    const validTypes = ['text', 'number', 'boolean', 'date', 'select'];
    if (!validTypes.includes(this.type)) {
      errors.push('Tipo deve ser: text, number, boolean, date ou select');
    }

    if (this.type === 'select' && (!this.options || this.options.length === 0)) {
      errors.push('Tipo select requer pelo menos uma opção');
    }

    if (this.type === 'select' && this.options) {
      this.options.forEach((option, index) => {
        if (!option || option.trim().length === 0) {
          errors.push(`Opção ${index + 1} não pode estar vazia`);
        }
      });
    }

    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      options: this.options,
      required: this.required,
      defaultValue: this.defaultValue,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromJSON(data) {
    return new StandardProperty(data);
  }
}

module.exports = StandardProperty;


