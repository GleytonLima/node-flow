const express = require('express');
const router = express.Router();
const nodeService = require('../services/NodeService');

// GET /api/search - Busca textual global avançada
router.get('/', async (req, res, next) => {
  try {
    const { q: query, workflow, type, includeProperties, standardProperty, propertyValue } = req.query;
    
    // Verificar se há pelo menos um critério de busca
    const hasQuery = query && query.trim().length > 0;
    const hasWorkflow = workflow && workflow.trim().length > 0;
    const hasType = type && type.trim().length > 0;
    const hasStandardProperty = standardProperty && standardProperty.trim().length > 0;
    const hasPropertyValue = propertyValue && propertyValue.trim().length > 0;
    
    if (!hasQuery && !hasWorkflow && !hasType && !hasStandardProperty && !hasPropertyValue) {
      return res.status(400).json({
        success: false,
        error: 'Pelo menos um critério de busca deve ser fornecido (query, workflow, type, standardProperty ou propertyValue)'
      });
    }

    const options = {
      workflow: workflow || null,
      type: type || null,
      includeProperties: includeProperties !== 'false', // Default true
      standardProperty: standardProperty || null,
      propertyValue: propertyValue || null
    };

    const results = await nodeService.searchNodes(query, options);

    res.json({
      success: true,
      data: results,
      count: results.length,
      query,
      filters: {
        workflow: options.workflow,
        type: options.type,
        includeProperties: options.includeProperties,
        standardProperty: options.standardProperty,
        propertyValue: options.propertyValue
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/search/workflows - Lista workflows disponíveis
router.get('/workflows', async (req, res, next) => {
  try {
    const workflows = await nodeService.getAvailableWorkflows();
    
    res.json({
      success: true,
      data: workflows,
      count: workflows.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/search/types - Lista tipos de etapa disponíveis
router.get('/types', async (req, res, next) => {
  try {
    const types = ['process', 'decision', 'parallel'];
    
    res.json({
      success: true,
      data: types,
      count: types.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/search/suggestions - Sugestões de busca baseadas em dados existentes
router.get('/suggestions', async (req, res, next) => {
  try {
    const { q: query } = req.query;
    const nodes = await nodeService.getAllNodes();
    const suggestions = new Set();

    if (query && query.length >= 2) {
      const normalizedQuery = query.toLowerCase();
      
      nodes.forEach(node => {
        // Sugestões de nomes de nós
        if (node.name.toLowerCase().includes(normalizedQuery)) {
          suggestions.add(node.name);
        }
        
        // Sugestões de workflows
        if (node.workflows) {
          node.workflows.forEach(workflow => {
            if (workflow.toLowerCase().includes(normalizedQuery)) {
              suggestions.add(workflow);
            }
          });
        }

        // Sugestões de etapas
        node.steps.forEach(step => {
          if (step.name.toLowerCase().includes(normalizedQuery)) {
            suggestions.add(step.name);
          }
        });
      });
    }

    res.json({
      success: true,
      data: Array.from(suggestions).slice(0, 10), // Limitar a 10 sugestões
      count: Math.min(suggestions.size, 10)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
