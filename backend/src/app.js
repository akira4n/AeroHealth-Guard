const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const config = require('./config/env');
const apiRateLimiter = require('./middlewares/rate-limiter.middleware');
const { notFoundHandler, errorHandler } = require('./middlewares/error-handler.middleware');
const apiRoutes = require('./routes');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Performance & Parsing Middlewares
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging Middleware
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.isProduction ? 'combined' : 'dev'));
}

// Rate Limiting on API routes
app.use('/api', apiRateLimiter);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'AeroHealth Guard Backend API',
    version: '1.0.0',
    documentation: '/docs',
    health: '/api/health'
  });
});

// Mount Main API Routes
app.use('/api', apiRoutes);

// 404 and Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
