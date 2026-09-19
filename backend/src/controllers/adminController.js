const adminService = require('../services/adminService');
const { successResponse } = require('../utils/response');

class AdminController {
  async getDashboardStats(req, res, next) {
    try {
      const stats = await adminService.getDashboardStats();
      return successResponse(res, stats, 'Dashboard analytics retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async getAllOrders(req, res, next) {
    try {
      const result = await adminService.getAllOrders(req.query);
      return successResponse(res, result.orders, 'Orders retrieved.', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getOrderDetails(req, res, next) {
    try {
      const order = await adminService.getOrderDetails(req.params.id);
      return successResponse(res, order, 'Order details retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { orderStatus, paymentStatus } = req.body;
      const order = await adminService.updateOrderStatus(req.params.id, {
        orderStatus,
        paymentStatus,
      });
      return successResponse(res, order, 'Order status updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req, res, next) {
    try {
      const result = await adminService.getAllUsers(req.query);
      return successResponse(res, result.users, 'Users retrieved.', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
