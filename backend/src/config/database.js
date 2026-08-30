const { PrismaClient } = require('@prisma/client');
const config = require('./env');

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: config.isProduction ? ['error', 'warn'] : ['query', 'info', 'warn', 'error']
  });
};

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (!config.isProduction) {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
