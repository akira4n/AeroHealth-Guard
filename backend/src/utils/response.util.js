/**
 * Standardized API Response Helper
 */

/**
 * Format standard success response
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {any} data
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Format standard error response
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {any} errors
 */
const errorResponse = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  successResponse,
  errorResponse
};
