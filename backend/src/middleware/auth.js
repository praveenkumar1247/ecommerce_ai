const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { errorResponse } = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication required. No token provided.', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
      }
      return errorResponse(res, 'Invalid token. Authentication failed.', 401, 'INVALID_TOKEN');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'User account no longer exists.', 401, 'USER_NOT_FOUND');
    }

    if (user.status !== 'ACTIVE') {
      return errorResponse(res, 'Your account has been deactivated or blocked.', 403, 'ACCOUNT_BLOCKED');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return errorResponse(res, 'Internal authentication error.', 500, 'AUTH_ERROR');
  }
};

module.exports = {
  authenticate,
};
