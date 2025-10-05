const Node = require('../models/Node');
const Step = require('../models/Step');
const fileUtils = require('../utils/fileUtils');

class NodeService {
  async getAllNodes() {
    try {
      const data = await fileUtils.getNodes();
      return data.nodes.map(nodeData => Node.fromJSON(nodeData));
    } catch (error) {
      throw new Error(`Erro ao buscar nós: ${error.message}`);
    }
  }

  async getNodeById(id) {
    try {
      const data = await fileUtils.getNodes();
      const nodeData = data.nodes.find(node => node.id === id);
      
      if (!nodeData) {
        throw new Error(`Nó com ID ${id} não encontrado`);
      }
      
      return Node.fromJSON(nodeData);
    } catch (error) {
      throw new Error(`Erro ao buscar nó: ${error.message}`);
    }
  }

  async createNode(nodeData) {
    try {
      const node = new Node(nodeData);
      const validation = node.validate();
      
      if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
      }

      const data = await fileUtils.getNodes();
      data.nodes.push(node.toJSON());
      await fileUtils.saveNodes(data);
      
      return node;
    } catch (error) {
      throw new Error(`Erro ao criar nó: ${error.message}`);
    }
  }

  async updateNode(id, updateData) {
    try {
      const data = await fileUtils.getNodes();
      const nodeIndex = data.nodes.findIndex(node => node.id === id);
      
      if (nodeIndex === -1) {
        throw new Error(`Nó com ID ${id} não encontrado`);
      }

      const existingNode = Node.fromJSON(data.nodes[nodeIndex]);
      const updatedNode = new Node({
        ...existingNode.toJSON(),
        ...updateData,
        id: id, // Manter o ID original
        updatedAt: new Date().toISOString()
      });

      const validation = updatedNode.validate();
      if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
      }

      data.nodes[nodeIndex] = updatedNode.toJSON();
      await fileUtils.saveNodes(data);
      
      return updatedNode;
    } catch (error) {
      throw new Error(`Erro ao atualizar nó: ${error.message}`);
    }
  }

  async deleteNode(id, options = {}) {
    try {
      const { force = false, cascade = true } = options;
      const data = await fileUtils.getNodes();
      const nodeIndex = data.nodes.findIndex(node => node.id === id);
      
      if (nodeIndex === -1) {
        throw new Error(`Nó com ID ${id} não encontrado`);
      }

      const nodeToDelete = data.nodes[nodeIndex];

      // Verificar dependências
      const dependencies = await this.getNodeDependencies(id);
      
      if (dependencies.length > 0 && !force) {
        // Retornar informações sobre as dependências para o frontend decidir
        return {
          canDelete: false,
          dependencies: dependencies,
          message: `O nó "${nodeToDelete.name}" possui ${dependencies.length} conexão(ões) que precisam ser removidas antes da exclusão.`
        };
      }

      // Se force=true ou cascade=true, remover todas as conexões
      if (cascade && dependencies.length > 0) {
        await this.removeAllConnectionsToNode(id, data);
      }

      // Deletar o nó
      data.nodes.splice(nodeIndex, 1);
      await fileUtils.saveNodes(data);
      
      return {
        canDelete: true,
        deleted: true,
        message: `Nó "${nodeToDelete.name}" deletado com sucesso.`
      };
    } catch (error) {
      throw new Error(`Erro ao deletar nó: ${error.message}`);
    }
  }

  async getNodeDependencies(nodeId) {
    try {
      const data = await fileUtils.getNodes();
      const dependencies = [];

      data.nodes.forEach(node => {
        node.steps.forEach(step => {
          step.connections.forEach(connection => {
            if (connection.targetNodeId === nodeId) {
              dependencies.push({
                nodeId: node.id,
                nodeName: node.name,
                stepId: step.id,
                stepName: step.name,
                connection: connection
              });
            }
          });
        });
      });

      return dependencies;
    } catch (error) {
      throw new Error(`Erro ao buscar dependências: ${error.message}`);
    }
  }

  async removeAllConnectionsToNode(targetNodeId, data) {
    try {
      let removedConnections = 0;

      data.nodes.forEach(node => {
        node.steps.forEach(step => {
          // Filtrar conexões que apontam para o nó alvo
          const originalLength = step.connections.length;
          step.connections = step.connections.filter(connection => 
            connection.targetNodeId !== targetNodeId
          );
          removedConnections += (originalLength - step.connections.length);
        });
      });

      return removedConnections;
    } catch (error) {
      throw new Error(`Erro ao remover conexões: ${error.message}`);
    }
  }

  async addStepToNode(nodeId, stepData) {
    try {
      const node = await this.getNodeById(nodeId);
      const step = new Step(stepData);
      
      const validation = step.validate();
      if (!validation.isValid) {
        throw new Error(`Dados inválidos da etapa: ${validation.errors.join(', ')}`);
      }

      node.addStep(step.toJSON());
      
      const data = await fileUtils.getNodes();
      const nodeIndex = data.nodes.findIndex(n => n.id === nodeId);
      data.nodes[nodeIndex] = node.toJSON();
      await fileUtils.saveNodes(data);
      
      return step;
    } catch (error) {
      throw new Error(`Erro ao adicionar etapa: ${error.message}`);
    }
  }

  async updateStepInNode(nodeId, stepId, stepData) {
    try {
      const node = await this.getNodeById(nodeId);
      const stepIndex = node.steps.findIndex(step => step.id === stepId);
      
      if (stepIndex === -1) {
        throw new Error(`Etapa com ID ${stepId} não encontrada no nó ${nodeId}`);
      }

      const existingStep = Step.fromJSON(node.steps[stepIndex]);
      const updatedStep = new Step({
        ...existingStep.toJSON(),
        ...stepData,
        id: stepId,
        updatedAt: new Date().toISOString()
      });

      const validation = updatedStep.validate();
      if (!validation.isValid) {
        throw new Error(`Dados inválidos da etapa: ${validation.errors.join(', ')}`);
      }

      node.updateStep(stepId, updatedStep.toJSON());
      
      const data = await fileUtils.getNodes();
      const nodeIndex = data.nodes.findIndex(n => n.id === nodeId);
      data.nodes[nodeIndex] = node.toJSON();
      await fileUtils.saveNodes(data);
      
      return updatedStep;
    } catch (error) {
      throw new Error(`Erro ao atualizar etapa: ${error.message}`);
    }
  }

  async deleteStepFromNode(nodeId, stepId) {
    try {
      const node = await this.getNodeById(nodeId);
      node.removeStep(stepId);
      
      const data = await fileUtils.getNodes();
      const nodeIndex = data.nodes.findIndex(n => n.id === nodeId);
      data.nodes[nodeIndex] = node.toJSON();
      await fileUtils.saveNodes(data);
      
      return true;
    } catch (error) {
      throw new Error(`Erro ao deletar etapa: ${error.message}`);
    }
  }

  // Sistema de busca avançado
  async searchNodes(query, options = {}) {
    try {
      const { workflow, type, includeProperties = true, standardProperty, propertyValue } = options;
      const nodes = await this.getAllNodes();
      const results = [];

      // Normalizar query para busca case-insensitive (se fornecida)
      const normalizedQuery = query ? query.toLowerCase() : '';
      const hasTextQuery = normalizedQuery.length > 0;

      nodes.forEach(node => {
        let nodeMatches = false;
        let stepMatches = [];

        // Buscar no nó (apenas se houver query textual)
        if (hasTextQuery) {
          if (this.matchesText(node.name, normalizedQuery) ||
              this.matchesText(node.description, normalizedQuery)) {
            nodeMatches = true;
          }

          // Buscar nas propriedades se habilitado
          if (includeProperties && node.properties) {
            // Buscar nas propriedades padrão
            if (node.properties.standardProps && this.searchInProperties(node.properties.standardProps, normalizedQuery)) {
              nodeMatches = true;
            }
            // Buscar nas propriedades customizadas
            if (node.properties.customProps && this.searchInProperties(node.properties.customProps, normalizedQuery)) {
              nodeMatches = true;
            }
          }
        }

        // Buscar nas etapas (apenas se houver query textual)
        if (hasTextQuery) {
          node.steps.forEach(step => {
            let stepMatch = false;
            
            if (this.matchesText(step.name, normalizedQuery) ||
                this.matchesText(step.description, normalizedQuery)) {
              stepMatch = true;
            }

            // Buscar nas propriedades da etapa
            if (includeProperties && step.properties) {
              if (this.searchInProperties(step.properties, normalizedQuery)) {
                stepMatch = true;
              }
            }

            // Buscar nas conexões (condições)
            step.connections.forEach(connection => {
              if (this.matchesText(connection.condition, normalizedQuery)) {
                stepMatch = true;
              }
            });

            if (stepMatch) {
              stepMatches.push({
                type: 'step',
                id: step.id,
                name: step.name,
                description: step.description,
                stepType: step.type,
                nodeId: node.id,
                nodeName: node.name,
                workflows: step.workflows,
                connections: step.connections
              });
            }
          });
        }

        // Aplicar filtros
        let shouldInclude = nodeMatches || stepMatches.length > 0;

        // Se não há busca textual, incluir todos os nós que atendem aos filtros
        if (!hasTextQuery) {
          shouldInclude = true;
        }

        // Filtrar por workflow
        if (workflow && shouldInclude) {
          const nodeWorkflows = node.workflows || [];
          const hasWorkflow = nodeWorkflows.includes(workflow) ||
            (hasTextQuery && stepMatches.some(step => step.workflows.includes(workflow)));
          shouldInclude = hasWorkflow;
        }

        // Filtrar por tipo de etapa
        if (type && shouldInclude) {
          if (hasTextQuery) {
            // Se há busca textual, verificar apenas nas etapas que já foram encontradas
            const hasType = stepMatches.some(step => step.stepType === type);
            shouldInclude = hasType;
          } else {
            // Se não há busca textual, verificar em todas as etapas do nó
            const hasType = node.steps.some(step => step.type === type);
            shouldInclude = hasType;
          }
        }

        // Filtrar por propriedade padrão
        if (standardProperty && shouldInclude) {
          const hasStandardProperty = node.properties && 
            node.properties.standardProps && 
            node.properties.standardProps.hasOwnProperty(standardProperty);
          shouldInclude = hasStandardProperty;
        }

        // Filtrar por valor da propriedade padrão
        if (propertyValue && standardProperty && shouldInclude) {
          const propertyExists = node.properties && 
            node.properties.standardProps && 
            node.properties.standardProps.hasOwnProperty(standardProperty);
          
          if (propertyExists) {
            const actualValue = node.properties.standardProps[standardProperty];
            const normalizedPropertyValue = propertyValue.toLowerCase();
            const normalizedActualValue = String(actualValue).toLowerCase();
            
            // Busca parcial no valor da propriedade
            const valueMatches = normalizedActualValue.includes(normalizedPropertyValue);
            shouldInclude = valueMatches;
          } else {
            shouldInclude = false;
          }
        }

        if (shouldInclude) {
          // Se não há busca textual, incluir todas as etapas do nó
          let stepsToInclude = stepMatches;
          if (!hasTextQuery) {
            stepsToInclude = node.steps.map(step => ({
              type: 'step',
              id: step.id,
              name: step.name,
              description: step.description,
              stepType: step.type,
              nodeId: node.id,
              nodeName: node.name,
              workflows: step.workflows,
              connections: step.connections
            }));
          }

          results.push({
            type: 'node',
            id: node.id,
            name: node.name,
            description: node.description,
            workflows: node.workflows,
            properties: node.properties,
            steps: stepsToInclude,
            hasMatchingSteps: stepsToInclude.length > 0
          });
        }
      });

      return results;
    } catch (error) {
      throw new Error(`Erro na busca: ${error.message}`);
    }
  }

  // Método auxiliar para busca de texto
  matchesText(text, query) {
    if (!text || !query) return false;
    return text.toLowerCase().includes(query);
  }

  // Método auxiliar para busca em propriedades
  searchInProperties(properties, query) {
    if (!properties || typeof properties !== 'object') return false;
    
    for (const [key, value] of Object.entries(properties)) {
      // Buscar no nome da propriedade (chave)
      if (this.matchesText(key, query)) {
        return true;
      }
      
      // Buscar no valor da propriedade
      if (value !== null && value !== undefined) {
        const stringValue = String(value);
        if (this.matchesText(stringValue, query)) {
          return true;
        }
        
        // Para arrays (como opções de select), buscar em cada item
        if (Array.isArray(value)) {
          for (const item of value) {
            if (this.matchesText(String(item), query)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  // Buscar workflows disponíveis
  async getAvailableWorkflows() {
    try {
      const nodes = await this.getAllNodes();
      const workflows = new Set();

      nodes.forEach(node => {
        if (node.workflows) {
          node.workflows.forEach(workflow => workflows.add(workflow));
        }
        
        node.steps.forEach(step => {
          if (step.workflows) {
            step.workflows.forEach(workflow => workflows.add(workflow));
          }
        });
      });

      return Array.from(workflows).sort();
    } catch (error) {
      throw new Error(`Erro ao buscar workflows: ${error.message}`);
    }
  }

  // Buscar cadeia de conexões de um nó
  async getNodeConnections(nodeId, maxDepth = 10) {
    try {
      const nodes = await this.getAllNodes();
      const startNode = nodes.find(node => node.id === nodeId);
      
      if (!startNode) {
        const error = new Error('Nó não encontrado');
        error.status = 404;
        throw error;
      }

      const connections = [];
      const visited = new Set();
      const queue = [{ node: startNode, depth: 0, path: [startNode.id] }];

      while (queue.length > 0) {
        const { node, depth, path } = queue.shift();

        if (depth >= maxDepth || visited.has(node.id)) {
          continue;
        }

        visited.add(node.id);

        // Buscar conexões diretas (etapas que conectam a outros nós)
        node.steps.forEach(step => {
          step.connections.forEach(connection => {
            const targetNode = nodes.find(n => n.id === connection.targetNodeId);
            if (targetNode && !visited.has(targetNode.id) && depth < maxDepth) {
              const connectionInfo = {
                fromNode: {
                  id: node.id,
                  name: node.name,
                  stepId: step.id,
                  stepName: step.name
                },
                toNode: {
                  id: targetNode.id,
                  name: targetNode.name
                },
                connection: {
                  condition: connection.condition,
                  type: connection.type
                },
                depth: depth + 1,
                path: [...path, targetNode.id]
              };

              connections.push(connectionInfo);

              // Adicionar à fila para continuar a busca
              queue.push({
                node: targetNode,
                depth: depth + 1,
                path: [...path, targetNode.id]
              });
            }
          });
        });
      }

      return connections;
    } catch (error) {
      if (error.status) {
        throw error; // Re-lançar erro com status
      }
      throw new Error(`Erro ao buscar conexões: ${error.message}`);
    }
  }
}

module.exports = new NodeService();
