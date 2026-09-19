const authService = require('../services/authService');
const { successResponse } = require('../utils/response');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, fullName, phone } = req.body;
      if (!email || !password || !fullName) {
        return res.status(400).json({
          success: false,
          message: 'Email, password, and full name are required.',
          code: 'VALIDATION_ERROR',
        });
      }
      const result = await authService.register({ email, password, fullName, phone });
      return successResponse(res, result, 'Registration successful.', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required.',
          code: 'VALIDATION_ERROR',
        });
      }
      const result = await authService.login({ email, password });
      return successResponse(res, result, 'Login successful.');
    } catch (error) {
      next(error);
    }
  }

  async adminLogin(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required.',
          code: 'VALIDATION_ERROR',
        });
      }
      const result = await authService.adminLogin({ email, password });
      return successResponse(res, result, 'Admin login successful.');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user.id);
      return successResponse(res, user, 'Current user profile fetched.');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { fullName, phone } = req.body;
      const user = await authService.updateProfile(req.user.id, { fullName, phone });
      return successResponse(res, user, 'Profile updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res) {
    // JWT is stateless on client side; we return success response
    return successResponse(res, null, 'Logged out successfully.');
  }
}

module.exports = new AuthController();
