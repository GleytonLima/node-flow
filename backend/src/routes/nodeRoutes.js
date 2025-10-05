const express = require('express');
const router = express.Router();
const nodeService = require('../services/NodeService');

// GET /api/nodes - Lista todos os nós
router.get('/', async (req, res, next) => {
  try {
    const nodes = await nodeService.getAllNodes();
    res.json({
      success: true,
      data: nodes,
      count: nodes.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/nodes/:id - Busca nó por ID
router.get('/:id', async (req, res, next) => {
  try {
    const node = await nodeService.getNodeById(req.params.id);
    res.json({
      success: true,
      data: node
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/nodes - Cria novo nó
router.post('/', async (req, res, next) => {
  try {
    const node = await nodeService.createNode(req.body);
    res.status(201).json({
      success: true,
      data: node,
      message: 'Nó criado com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/nodes/:id - Atualiza nó
router.put('/:id', async (req, res, next) => {
  try {
    const node = await nodeService.updateNode(req.params.id, req.body);
    res.json({
      success: true,
      data: node,
      message: 'Nó atualizado com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/nodes/:id - Deleta nó
router.delete('/:id', async (req, res, next) => {
  try {
    const { force, cascade } = req.query;
    const options = {
      force: force === 'true',
      cascade: cascade !== 'false' // default true
    };

    const result = await nodeService.deleteNode(req.params.id, options);
    
    if (result.canDelete === false) {
      return res.status(409).json({
        success: false,
        canDelete: false,
        dependencies: result.dependencies,
        message: result.message
      });
    }

    res.json({
      success: true,
      canDelete: true,
      deleted: result.deleted,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/nodes/:id/dependencies - Busca dependências do nó
router.get('/:id/dependencies', async (req, res, next) => {
  try {
    const dependencies = await nodeService.getNodeDependencies(req.params.id);
    res.json({
      success: true,
      data: dependencies,
      count: dependencies.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/nodes/:id/deletion-info - Informações sobre exclusão do nó
router.get('/:id/deletion-info', async (req, res, next) => {
  try {
    const node = await nodeService.getNodeById(req.params.id);
    const dependencies = await nodeService.getNodeDependencies(req.params.id);
    
    res.json({
      success: true,
      data: {
        node: {
          id: node.id,
          name: node.name,
          description: node.description
        },
        dependencies: dependencies,
        canDelete: dependencies.length === 0,
        message: dependencies.length === 0 
          ? 'Nó pode ser deletado sem problemas'
          : `Nó possui ${dependencies.length} conexão(ões) que serão removidas`
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/nodes/:id/steps - Adiciona etapa ao nó
router.post('/:id/steps', async (req, res, next) => {
  try {
    const step = await nodeService.addStepToNode(req.params.id, req.body);
    res.status(201).json({
      success: true,
      data: step,
      message: 'Etapa adicionada com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/nodes/:nodeId/steps/:stepId - Atualiza etapa do nó
router.put('/:nodeId/steps/:stepId', async (req, res, next) => {
  try {
    const step = await nodeService.updateStepInNode(req.params.nodeId, req.params.stepId, req.body);
    res.json({
      success: true,
      data: step,
      message: 'Etapa atualizada com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/nodes/:nodeId/steps/:stepId - Remove etapa do nó
router.delete('/:nodeId/steps/:stepId', async (req, res, next) => {
  try {
    await nodeService.deleteStepFromNode(req.params.nodeId, req.params.stepId);
    res.json({
      success: true,
      message: 'Etapa removida com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/nodes/:id/connections - Busca cadeia de conexões do nó
router.get('/:id/connections', async (req, res, next) => {
  try {
    const { maxDepth = 10 } = req.query;
    const connections = await nodeService.getNodeConnections(req.params.id, parseInt(maxDepth));
    res.json({
      success: true,
      data: connections,
      count: connections.length,
      maxDepth: parseInt(maxDepth)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
