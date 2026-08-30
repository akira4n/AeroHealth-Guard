const config = require('../config/env');
const { errorResponse } = require('../utils/response.util');

/**
 * 404 Not Found Middleware
 */
const notFoundHandler = (req, res, _next) => {
  return errorResponse(res, 404, `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`);
};

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, _next) => {
  console.error('[Error]:', err);

  // Prisma known errors
  if (err.code && err.code.startsWith('P')) {
    return errorResponse(res, 400, 'Terjadi kesalahan pada kueri basis data.', {
      code: err.code,
      meta: err.meta
    });
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return errorResponse(res, 400, 'Validasi input gagal.', err.issues || err.errors);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan internal pada server.';

  return errorResponse(res, statusCode, message, config.isProduction ? null : { stack: err.stack });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
