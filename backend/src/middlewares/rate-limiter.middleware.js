const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const { errorResponse } = require('../utils/response.util');

const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(
      res,
      429,
      'Terlalu banyak permintaan dari IP ini, silakan coba lagi dalam 1 menit.'
    );
  }
});

module.exports = apiRateLimiter;
