const errorHandler = (err, req, res, next) => {
  console.error('Erro:', err);

  // Erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erro de validação',
      details: err.message
    });
  }

  // Erro de arquivo não encontrado
  if (err.code === 'ENOENT') {
    return res.status(404).json({
      error: 'Arquivo não encontrado',
      details: err.message
    });
  }

  // Erro de JSON inválido
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON inválido',
      details: 'Formato de dados incorreto'
    });
  }

  // Erro com status personalizado
  if (err.status) {
    return res.status(err.status).json({
      success: false,
      error: err.message
    });
  }

  // Erro interno do servidor
  res.status(500).json({
    error: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
