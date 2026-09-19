const cartService = require('../services/cartService');
const { successResponse } = require('../utils/response');

class CartController {
  async getCart(req, res, next) {
    try {
      const cart = await cartService.getCart(req.user.id);
      return successResponse(res, cart, 'Cart retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  async addItem(req, res, next) {
    try {
      const { productId, quantity } = req.body;
      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required.',
          code: 'VALIDATION_ERROR',
        });
      }
      const cart = await cartService.addItem(req.user.id, { productId, quantity });
      return successResponse(res, cart, 'Item added to cart successfully.');
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req, res, next) {
    try {
      const { quantity } = req.body;
      const cart = await cartService.updateItem(req.user.id, req.params.id, { quantity });
      return successResponse(res, cart, 'Cart item updated.');
    } catch (error) {
      next(error);
    }
  }

  async removeItem(req, res, next) {
    try {
      const cart = await cartService.removeItem(req.user.id, req.params.id);
      return successResponse(res, cart, 'Item removed from cart.');
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req, res, next) {
    try {
      const result = await cartService.clearCart(req.user.id);
      return successResponse(res, result, 'Cart cleared.');
    } catch (error) {
      next(error);
    }
  }

  async validateCart(req, res, next) {
    try {
      const validation = await cartService.validateCart(req.user.id);
      return successResponse(res, validation, 'Cart stock validation complete.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CartController();
