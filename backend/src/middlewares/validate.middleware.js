const { errorResponse } = require('../utils/response.util');

/**
 * Middleware generator to validate request parts against Zod schemas
 * @param {{ body?: import('zod').ZodType, query?: import('zod').ZodType, params?: import('zod').ZodType }} schemas
 */
const validate = (schemas) => {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      return next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const formattedErrors = error.issues
          ? error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message
            }))
          : error.errors;
        return errorResponse(res, 400, 'Validasi input gagal.', formattedErrors);
      }
      return next(error);
    }
  };
};

module.exports = validate;
