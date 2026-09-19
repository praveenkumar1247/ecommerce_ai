const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const sanitizeUser = (user) => {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
};

class AuthService {
  async register({ email, password, fullName, phone }) {
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      const error = new Error('An account with this email address already exists.');
      error.statusCode = 409;
      error.code = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName: fullName.trim(),
        phone: phone ? phone.trim() : null,
        role: 'USER',
        status: 'ACTIVE',
        cart: {
          create: {},
        },
      },
      include: {
        cart: true,
      },
    });

    const token = generateToken(user);
    return { user: sanitizeUser(user), token };
  }

  async login({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        cart: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    if (user.status !== 'ACTIVE') {
      const error = new Error('Your account has been deactivated or blocked.');
      error.statusCode = 403;
      error.code = 'ACCOUNT_BLOCKED';
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const token = generateToken(user);
    return { user: sanitizeUser(user), token };
  }

  async adminLogin({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      const error = new Error('Invalid admin credentials.');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    if (user.role !== 'ADMIN') {
      const error = new Error('Access denied. Administrator privileges required.');
      error.statusCode = 403;
      error.code = 'NOT_AN_ADMIN';
      throw error;
    }

    if (user.status !== 'ACTIVE') {
      const error = new Error('Your administrator account is suspended.');
      error.statusCode = 403;
      error.code = 'ACCOUNT_BLOCKED';
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid admin credentials.');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const token = generateToken(user);
    return { user: sanitizeUser(user), token };
  }

  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        cart: {
          include: {
            items: true,
          },
        },
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
      },
    });

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return sanitizeUser(user);
  }

  async updateProfile(userId, { fullName, phone }) {
    const data = {};
    if (fullName) data.fullName = fullName.trim();
    if (phone !== undefined) data.phone = phone ? phone.trim() : null;

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return sanitizeUser(updated);
  }
}

module.exports = new AuthService();
