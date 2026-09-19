const orderService = require('../services/orderService');
const { successResponse } = require('../utils/response');

class OrderController {
  async checkoutPreview(req, res, next) {
    try {
      const preview = await orderService.checkoutPreview(req.user.id, {
        addressId: req.body.addressId,
      });
      return successResponse(res, preview, 'Checkout preview generated.');
    } catch (error) {
      next(error);
    }
  }

  async createOrder(req, res, next) {
    try {
      const { addressId, paymentMethod, paymentDetails, notes } = req.body;
      const order = await orderService.createOrder(req.user.id, {
        addressId,
        paymentMethod,
        paymentDetails,
        notes,
      });
      return successResponse(res, order, 'Order placed successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  async getUserOrders(req, res, next) {
    try {
      const orders = await orderService.getUserOrders(req.user.id);
      return successResponse(res, orders, 'Orders retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const order = await orderService.getOrderById(req.user.id, req.params.id);
      return successResponse(res, order, 'Order details retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async cancelOrder(req, res, next) {
    try {
      const order = await orderService.cancelOrder(req.user.id, req.params.id);
      return successResponse(res, order, 'Order cancelled successfully and inventory restored.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
