const { successResponse } = require('../utils/response.util');

const getHealthStatus = (req, res) => {
  return successResponse(res, 200, 'AeroHealth Guard API is healthy and operational', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
};

module.exports = {
  getHealthStatus
};
