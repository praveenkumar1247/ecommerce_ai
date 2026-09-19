const prisma = require('../config/prisma');
const mockProvider = require('./payment/mockPaymentProvider');

class PaymentService {
  /**
   * Process payment for an order and update order status within atomic integrity
   */
  async processOrderPayment(userId, { orderId, paymentMethod, paymentDetails }) {
    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(orderId, 10),
        userId: parseInt(userId, 10),
      },
      include: {
        payment: true,
      },
    });

    if (!order) {
      const error = new Error('Order not found.');
      error.statusCode = 404;
      throw error;
    }

    if (order.paymentStatus === 'PAID') {
      const error = new Error('This order has already been paid.');
      error.statusCode = 400;
      throw error;
    }

    if (order.orderStatus === 'CANCELLED') {
      const error = new Error('Cannot process payment for a cancelled order.');
      error.statusCode = 400;
      throw error;
    }

    // Server-side payment gateway processing
    const gatewayResult = await mockProvider.processPayment({
      orderNumber: order.orderNumber,
      amount: Number(order.totalAmount),
      currency: 'INR',
      paymentMethod,
      paymentDetails,
    });

    if (gatewayResult.success) {
      // Update Payment and Order Status transactionally
      const updatedOrder = await prisma.$transaction(async (tx) => {
        // Upsert payment record
        await tx.payment.upsert({
          where: { orderId: order.id },
          create: {
            orderId: order.id,
            paymentMethod,
            transactionId: gatewayResult.transactionId,
            amount: order.totalAmount,
            currency: 'INR',
            status: 'SUCCESS',
            providerResponse: gatewayResult.rawResponse,
          },
          update: {
            paymentMethod,
            transactionId: gatewayResult.transactionId,
            status: 'SUCCESS',
            providerResponse: gatewayResult.rawResponse,
          },
        });

        // Update Order to CONFIRMED and PAID
        return tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            orderStatus: order.orderStatus === 'PENDING' ? 'CONFIRMED' : order.orderStatus,
          },
          include: {
            items: true,
            payment: true,
          },
        });
      });

      return {
        success: true,
        message: 'Payment processed successfully.',
        order: updatedOrder,
      };
    } else {
      // Record failed payment attempt
      await prisma.payment.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          paymentMethod,
          transactionId: gatewayResult.transactionId,
          amount: order.totalAmount,
          currency: 'INR',
          status: 'FAILED',
          providerResponse: gatewayResult.rawResponse,
        },
        update: {
          paymentMethod,
          transactionId: gatewayResult.transactionId,
          status: 'FAILED',
          providerResponse: gatewayResult.rawResponse,
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'FAILED' },
      });

      const error = new Error(gatewayResult.message || 'Payment processing failed.');
      error.statusCode = 400;
      error.code = 'PAYMENT_FAILED';
      throw error;
    }
  }
}

module.exports = new PaymentService();
