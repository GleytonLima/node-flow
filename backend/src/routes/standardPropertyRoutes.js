const express = require('express');
const router = express.Router();
const StandardPropertyService = require('../services/StandardPropertyService');

// GET /api/standard-properties - Listar todas as propriedades padrão
router.get('/', async (req, res, next) => {
  try {
    const standardPropertyService = new StandardPropertyService();
    const properties = await standardPropertyService.getAllProperties();
    
    res.json({
      success: true,
      data: properties,
      count: properties.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/standard-properties/:id - Obter propriedade padrão por ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const standardPropertyService = new StandardPropertyService();
    const property = await standardPropertyService.getPropertyById(id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Propriedade padrão não encontrada'
      });
    }
    
    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/standard-properties - Criar nova propriedade padrão
router.post('/', async (req, res, next) => {
  try {
    const propertyData = req.body;
    const standardPropertyService = new StandardPropertyService();
    const newProperty = await standardPropertyService.createProperty(propertyData);
    
    res.status(201).json({
      success: true,
      data: newProperty,
      message: 'Propriedade padrão criada com sucesso'
    });
  } catch (error) {
    if (error.message.includes('Já existe uma propriedade padrão com este nome')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Erro de validação')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    next(error);
  }
});

// PUT /api/standard-properties/:id - Atualizar propriedade padrão
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const propertyData = req.body;
    const standardPropertyService = new StandardPropertyService();
    const updatedProperty = await standardPropertyService.updateProperty(id, propertyData);
    
    res.json({
      success: true,
      data: updatedProperty,
      message: 'Propriedade padrão atualizada com sucesso'
    });
  } catch (error) {
    if (error.message === 'Propriedade padrão não encontrada') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Já existe uma propriedade padrão com este nome')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Erro de validação')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    next(error);
  }
});

// DELETE /api/standard-properties/:id - Excluir propriedade padrão
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const standardPropertyService = new StandardPropertyService();
    const deletedProperty = await standardPropertyService.deleteProperty(id);
    
    res.json({
      success: true,
      data: deletedProperty,
      message: 'Propriedade padrão excluída com sucesso'
    });
  } catch (error) {
    if (error.message === 'Propriedade padrão não encontrada') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Não é possível excluir propriedade que está sendo usada')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    next(error);
  }
});

// GET /api/standard-properties/:id/usage - Obter uso da propriedade padrão
router.get('/:id/usage', async (req, res, next) => {
  try {
    const { id } = req.params;
    const standardPropertyService = new StandardPropertyService();
    const usage = await standardPropertyService.getPropertyUsage(id);
    
    res.json({
      success: true,
      data: usage,
      count: usage.length
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


