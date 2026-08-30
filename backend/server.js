const app = require('./src/app');
const config = require('./src/config/env');
const prisma = require('./src/config/database');

const server = app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(`🚀 AeroHealth Guard Backend running on port ${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🩺 Health check: http://localhost:${config.port}/api/health`);
  console.log(`===============================================`);
});

// Graceful Shutdown
const handleShutdown = async (signal) => {
  console.log(`\n[${signal}] Shutting down server gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await prisma.$disconnect();
      console.log('Database connection closed.');
    } catch (err) {
      console.error('Error disconnecting database:', err);
    }
    process.exit(0);
  });

  // Force close after 10s if graceful shutdown fails
  setTimeout(() => {
    console.error('Forcing server shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
