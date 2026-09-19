const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Application Error:', err);

  // Multer Errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'File too large. Maximum allowed size is 5MB.', 400, 'FILE_TOO_LARGE');
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return errorResponse(res, 'Too many files uploaded. Maximum is 5 images per request.', 400, 'TOO_MANY_FILES');
    }
    return errorResponse(res, `Upload error: ${err.message}`, 400, 'UPLOAD_ERROR');
  }

  // Custom filter error from multer or app
  if (err.message && err.message.includes('Invalid file type')) {
    return errorResponse(res, err.message, 400, 'INVALID_FILE_TYPE');
  }

  // Prisma Unique Constraint Violation
  if (err.code === 'P2002') {
    const fields = err.meta && err.meta.target ? err.meta.target : 'field';
    return errorResponse(
      res,
      `A record with this ${fields} already exists.`,
      409,
      'DUPLICATE_ENTRY'
    );
  }

  // Prisma Record Not Found
  if (err.code === 'P2025') {
    return errorResponse(res, 'The requested record was not found.', 404, 'RECORD_NOT_FOUND');
  }

  // Default fallback (don't leak sensitive stack traces)
  const message = process.env.NODE_ENV === 'development' ? err.message : 'An unexpected server error occurred.';
  return errorResponse(res, message, err.statusCode || 500, err.code || 'INTERNAL_SERVER_ERROR');
};

module.exports = errorHandler;
