const paymentService = require('../services/paymentService');
const { successResponse } = require('../utils/response');

class PaymentController {
  async processPayment(req, res, next) {
    try {
      const { orderId, paymentMethod, paymentDetails } = req.body;
      if (!orderId || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'Order ID and payment method are required.',
          code: 'VALIDATION_ERROR',
        });
      }

      const result = await paymentService.processOrderPayment(req.user.id, {
        orderId,
        paymentMethod,
        paymentDetails,
      });

      return successResponse(res, result.order, result.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
