const express = require('express');
const router = express.Router();
const fileUtils = require('../utils/fileUtils');

// GET /api/properties/standard - Busca propriedades padrão
router.get('/standard', async (req, res, next) => {
  try {
    const properties = await fileUtils.getStandardProperties();
    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/properties/standard - Atualiza propriedades padrão
router.post('/standard', async (req, res, next) => {
  try {
    await fileUtils.saveStandardProperties(req.body);
    res.json({
      success: true,
      message: 'Propriedades padrão atualizadas com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
