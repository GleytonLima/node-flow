const express = require('express');
const router = express.Router();
const workflowService = require('../services/WorkflowService');

// GET /api/workflows - Lista todos os workflows
router.get('/', async (req, res, next) => {
  try {
    const workflows = await workflowService.getAllWorkflows();
    res.json({
      success: true,
      data: workflows,
      count: workflows.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/workflows/:id - Busca workflow por ID
router.get('/:id', async (req, res, next) => {
  try {
    const workflow = await workflowService.getWorkflowById(req.params.id);
    res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/workflows - Cria novo workflow
router.post('/', async (req, res, next) => {
  try {
    const workflow = await workflowService.createWorkflow(req.body);
    res.status(201).json({
      success: true,
      data: workflow,
      message: 'Workflow criado com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/workflows/:id - Atualiza workflow
router.put('/:id', async (req, res, next) => {
  try {
    const workflow = await workflowService.updateWorkflow(req.params.id, req.body);
    res.json({
      success: true,
      data: workflow,
      message: 'Workflow atualizado com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/workflows/:id - Deleta workflow
router.delete('/:id', async (req, res, next) => {
  try {
    const workflow = await workflowService.deleteWorkflow(req.params.id);
    res.json({
      success: true,
      data: workflow,
      message: 'Workflow deletado com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/workflows/:id/usage - Verifica uso do workflow
router.get('/:id/usage', async (req, res, next) => {
  try {
    const usage = await workflowService.getWorkflowUsage(req.params.id);
    res.json({
      success: true,
      data: usage
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
