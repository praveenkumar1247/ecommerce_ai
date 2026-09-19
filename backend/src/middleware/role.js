const { errorResponse } = require('../utils/response');

/**
 * Middleware to restrict route access to specific roles (e.g. ADMIN)
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required.', 401, 'UNAUTHORIZED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        'Forbidden: You do not have permission to perform this action.',
        403,
        'FORBIDDEN'
      );
    }

    next();
  };
};

module.exports = {
  authorize,
};
