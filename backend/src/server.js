const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import routes
const nodeRoutes = require('./routes/nodeRoutes');
const searchRoutes = require('./routes/searchRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const standardPropertyRoutes = require('./routes/standardPropertyRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5200;

// Middleware
app.use(helmet());

// CORS configurado para desenvolvimento local
const corsOptions = {
  origin: [
    'http://localhost:4200', // Angular dev server
    'http://127.0.0.1:4200',
    'http://localhost:5200', // Backend
    'http://127.0.0.1:5200'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from data directory
app.use('/data', express.static(path.join(__dirname, '../../data')));

// Routes
app.use('/api/nodes', nodeRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/standard-properties', standardPropertyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint não encontrado',
    path: req.originalUrl 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📁 Dados estáticos: http://localhost:${PORT}/data`);
});

module.exports = app;
