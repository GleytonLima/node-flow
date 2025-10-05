const fileUtils = require('../utils/fileUtils');
const Workflow = require('../models/Workflow');

class WorkflowService {
  constructor() {
    this.filePath = 'data/workflows/workflows.json';
  }

  async getAllWorkflows() {
    try {
      const data = await fileUtils.getWorkflows();
      console.log('Data from fileUtils:', JSON.stringify(data));
      const workflows = data.workflows.map(workflow => Workflow.fromJSON(workflow));
      console.log('Mapped workflows:', JSON.stringify(workflows));
      return workflows;
    } catch (error) {
      throw new Error(`Erro ao buscar workflows: ${error.message}`);
    }
  }

  async getWorkflowById(id) {
    try {
      const workflows = await this.getAllWorkflows();
      const workflow = workflows.find(w => w.id === id);
      
      if (!workflow) {
        const error = new Error('Workflow não encontrado');
        error.status = 404;
        throw error;
      }

      return workflow;
    } catch (error) {
      if (error.status) {
        throw error;
      }
      throw new Error(`Erro ao buscar workflow: ${error.message}`);
    }
  }

  async createWorkflow(workflowData) {
    try {
      const workflow = new Workflow(workflowData);
      workflow.validate();

      // Verificar se já existe um workflow com o mesmo nome
      const existingWorkflows = await this.getAllWorkflows();
      const nameExists = existingWorkflows.some(w => 
        w.name.toLowerCase() === workflow.name.toLowerCase()
      );

      if (nameExists) {
        const error = new Error('Já existe um workflow com este nome');
        error.status = 409;
        throw error;
      }

      // Adicionar o novo workflow
      existingWorkflows.push(workflow);

      // Salvar no arquivo
      await this.saveWorkflows(existingWorkflows);

      return workflow;
    } catch (error) {
      if (error.status) {
        throw error;
      }
      // Se for erro de validação, retornar como 400
      if (error.message.includes('obrigatório') || error.message.includes('máximo')) {
        const validationError = new Error(error.message);
        validationError.status = 400;
        throw validationError;
      }
      throw new Error(`Erro ao criar workflow: ${error.message}`);
    }
  }

  async updateWorkflow(id, workflowData) {
    try {
      const workflows = await this.getAllWorkflows();
      const index = workflows.findIndex(w => w.id === id);

      if (index === -1) {
        const error = new Error('Workflow não encontrado');
        error.status = 404;
        throw error;
      }

      // Verificar se o novo nome já existe em outro workflow
      if (workflowData.name) {
        const nameExists = workflows.some((w, i) => 
          i !== index && w.name.toLowerCase() === workflowData.name.toLowerCase()
        );

        if (nameExists) {
          const error = new Error('Já existe um workflow com este nome');
          error.status = 409;
          throw error;
        }
      }

      // Atualizar o workflow
      const updatedWorkflow = new Workflow({
        ...workflows[index].toJSON(),
        ...workflowData,
        id: id, // Manter o ID original
        updatedAt: new Date().toISOString()
      });

      updatedWorkflow.validate();
      workflows[index] = updatedWorkflow;

      // Salvar no arquivo
      await this.saveWorkflows(workflows);

      return updatedWorkflow;
    } catch (error) {
      if (error.status) {
        throw error;
      }
      throw new Error(`Erro ao atualizar workflow: ${error.message}`);
    }
  }

  async deleteWorkflow(id) {
    try {
      const workflows = await this.getAllWorkflows();
      const index = workflows.findIndex(w => w.id === id);

      if (index === -1) {
        const error = new Error('Workflow não encontrado');
        error.status = 404;
        throw error;
      }

      // Verificar se o workflow está sendo usado em nós ou etapas
      const nodeService = require('./NodeService');
      const nodes = await nodeService.getAllNodes();
      
      const isUsedInNodes = nodes.some(node => 
        node.workflows && node.workflows.includes(id)
      );

      const isUsedInSteps = nodes.some(node =>
        node.steps.some(step => 
          step.workflows && step.workflows.includes(id)
        )
      );

      if (isUsedInNodes || isUsedInSteps) {
        const error = new Error('Não é possível deletar workflow que está sendo usado em nós ou etapas');
        error.status = 409;
        throw error;
      }

      // Remover o workflow
      const deletedWorkflow = workflows[index];
      workflows.splice(index, 1);

      // Salvar no arquivo
      await this.saveWorkflows(workflows);

      return deletedWorkflow;
    } catch (error) {
      if (error.status) {
        throw error;
      }
      throw new Error(`Erro ao deletar workflow: ${error.message}`);
    }
  }

  async saveWorkflows(workflows) {
    try {
      const data = {
        version: '1.0',
        workflows: workflows.map(w => w.toJSON())
      };

      await fileUtils.saveWorkflows(data);
    } catch (error) {
      throw new Error(`Erro ao salvar workflows: ${error.message}`);
    }
  }

  // Método para verificar se um workflow existe
  async workflowExists(id) {
    try {
      await this.getWorkflowById(id);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Método para obter estatísticas de uso do workflow
  async getWorkflowUsage(id) {
    try {
      const nodeService = require('./NodeService');
      const nodes = await nodeService.getAllNodes();
      
      const usedInNodes = nodes.filter(node => 
        node.workflows && node.workflows.includes(id)
      );

      const usedInSteps = [];
      nodes.forEach(node => {
        node.steps.forEach(step => {
          if (step.workflows && step.workflows.includes(id)) {
            usedInSteps.push({
              nodeId: node.id,
              nodeName: node.name,
              stepId: step.id,
              stepName: step.name
            });
          }
        });
      });

      return {
        usedInNodes: usedInNodes.length,
        usedInSteps: usedInSteps.length,
        nodeDetails: usedInNodes.map(n => ({ id: n.id, name: n.name })),
        stepDetails: usedInSteps
      };
    } catch (error) {
      throw new Error(`Erro ao obter uso do workflow: ${error.message}`);
    }
  }
}

module.exports = new WorkflowService();
