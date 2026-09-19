/**
 * Standardized API Response Utilities
 */

const successResponse = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
  const payload = {
    success: true,
    message,
    data,
  };
  if (meta) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
};

const errorResponse = (res, message = 'An error occurred', statusCode = 500, code = 'INTERNAL_ERROR', errors = null) => {
  const payload = {
    success: false,
    message,
    code,
  };
  if (errors) {
    payload.errors = errors;
  }
  return res.status(statusCode).json(payload);
};

module.exports = {
  successResponse,
  errorResponse,
};
