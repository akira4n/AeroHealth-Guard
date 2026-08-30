const dotenv = require('dotenv');

dotenv.config();

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  databaseUrl: process.env.DATABASE_URL || '',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute (ms)
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10) // 100 req/min/IP
  }
};

module.exports = config;
