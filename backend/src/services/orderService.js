const prisma = require('../config/prisma');
const cartService = require('./cartService');
const addressService = require('./addressService');
const mockPaymentProvider = require('./payment/mockPaymentProvider');
const { calculateOrderTotals, roundTo2 } = require('../utils/pricing');

class OrderService {
  /**
   * Preview checkout: recomputes pricing, taxes, shipping, and validates inventory
   */
  async checkoutPreview(userId, { addressId }) {
    const uId = parseInt(userId, 10);
    const cart = await cartService.getCart(uId);

    if (!cart.items || cart.items.length === 0) {
      const error = new Error('Your cart is empty.');
      error.statusCode = 400;
      error.code = 'EMPTY_CART';
      throw error;
    }

    if (cart.hasStockIssue) {
      const error = new Error('One or more items in your cart have stock availability issues.');
      error.statusCode = 400;
      error.code = 'STOCK_MISMATCH';
      error.cart = cart;
      throw error;
    }

    let selectedAddress = null;
    if (addressId) {
      selectedAddress = await addressService.getAddressById(uId, addressId);
    } else {
      const addresses = await addressService.getUserAddresses(uId);
      selectedAddress = addresses.find((a) => a.isDefault) || addresses[0] || null;
    }

    return {
      items: cart.items,
      summary: cart.summary,
      shippingAddress: selectedAddress,
    };
  }

  /**
   * Create Order with Atomic Inventory Reservation & Concurrency Protection
   * Rule 7, 8, 21: Prevents race condition overselling via MySQL row-level locking
   */
  async createOrder(userId, { addressId, paymentMethod = 'MOCK_CARD', paymentDetails = {}, notes = null }) {
    const uId = parseInt(userId, 10);

    // 1. Validate shipping address
    if (!addressId) {
      const error = new Error('Shipping address is required.');
      error.statusCode = 400;
      throw error;
    }

    const address = await addressService.getAddressById(uId, addressId);
    const shippingAddressSnapshot = {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
      addressType: address.addressType,
    };

    // 2. Fetch User Cart
    const userCart = await prisma.cart.findUnique({
      where: { userId: uId },
      include: {
        items: {
          include: {
            product: {
              include: { images: true },
            },
          },
        },
      },
    });

    if (!userCart || userCart.items.length === 0) {
      const error = new Error('Your cart is empty. Please add items before checking out.');
      error.statusCode = 400;
      error.code = 'EMPTY_CART';
      throw error;
    }

    // 3. Execute Transactional Stock Reservation with Row Locking
    const result = await prisma.$transaction(async (tx) => {
      const orderItemPayloads = [];
      const itemSummaries = [];

      for (const cartItem of userCart.items) {
        const prodId = cartItem.productId;
        const requestedQty = cartItem.quantity;

        // Atomic Row-level Lock on the product row
        // SELECT ... FOR UPDATE ensures any concurrent order waits until this finishes
        const [lockedProduct] = await tx.$queryRaw`
          SELECT id, name, brand, price, discountPercent, offerPrice, stockQuantity, status 
          FROM products 
          WHERE id = ${prodId} AND deletedAt IS NULL 
          FOR UPDATE
        `;

        if (!lockedProduct) {
          const error = new Error(`Product #${prodId} is no longer available.`);
          error.statusCode = 400;
          error.code = 'PRODUCT_UNAVAILABLE';
          throw error;
        }

        if (lockedProduct.status !== 'ACTIVE' || lockedProduct.stockQuantity < requestedQty) {
          const error = new Error(
            `Insufficient stock for "${lockedProduct.name}". Requested: ${requestedQty}, Available: ${lockedProduct.stockQuantity}.`
          );
          error.statusCode = 400;
          error.code = 'INSUFFICIENT_STOCK';
          throw error;
        }

        // Atomically Decrement Inventory
        const newStock = lockedProduct.stockQuantity - requestedQty;
        const newStatus = newStock === 0 ? 'OUT_OF_STOCK' : lockedProduct.status;

        await tx.product.update({
          where: { id: prodId },
          data: {
            stockQuantity: newStock,
            status: newStatus,
          },
        });

        // Price snapshots
        const priceSnap = Number(lockedProduct.price);
        const discountSnap = Number(lockedProduct.discountPercent);
        const finalPrice = Number(lockedProduct.offerPrice);
        const lineSubtotal = roundTo2(finalPrice * requestedQty);

        const primaryImg = cartItem.product.images.find((i) => i.isPrimary) || cartItem.product.images[0];

        orderItemPayloads.push({
          productId: prodId,
          productNameSnapshot: lockedProduct.name,
          brandSnapshot: lockedProduct.brand,
          priceSnapshot: priceSnap,
          discountSnapshot: discountSnap,
          finalPrice: finalPrice,
          quantity: requestedQty,
          subtotal: lineSubtotal,
          imageUrlSnapshot: primaryImg ? primaryImg.imageUrl : null,
        });

        itemSummaries.push({
          price: priceSnap,
          offerPrice: finalPrice,
          quantity: requestedQty,
        });
      }

      // Calculate verified server-side totals
      const financialTotals = calculateOrderTotals(itemSummaries);

      // Generate unique order number
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `ORD-${datePart}-${randomSuffix}`;

      // Create Order
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: uId,
          subtotal: financialTotals.subtotal,
          discount: financialTotals.discount,
          shippingFee: financialTotals.shippingFee,
          tax: financialTotals.tax,
          totalAmount: financialTotals.totalAmount,
          orderStatus: 'PENDING',
          paymentStatus: 'PENDING',
          shippingAddressSnapshot,
          notes: notes ? notes.trim() : null,
          items: {
            create: orderItemPayloads,
          },
        },
        include: {
          items: true,
        },
      });

      // Clear user's cart items inside the transaction
      await tx.cartItem.deleteMany({
        where: { cartId: userCart.id },
      });

      return createdOrder;
    });

    // 4. Process Payment Server-Side
    if (paymentMethod === 'COD') {
      // Cash on delivery: Order confirmed, payment pending until delivery
      const updatedOrder = await prisma.order.update({
        where: { id: result.id },
        data: {
          orderStatus: 'CONFIRMED',
          paymentStatus: 'PENDING',
          payment: {
            create: {
              paymentMethod: 'COD',
              transactionId: `COD-${Date.now()}-${result.id}`,
              amount: result.totalAmount,
              currency: 'INR',
              status: 'PENDING',
            },
          },
        },
        include: {
          items: true,
          payment: true,
        },
      });
      return updatedOrder;
    }

    // Digital Payment methods (MOCK_CARD, MOCK_UPI, MOCK_NETBANKING)
    const paymentResult = await mockPaymentProvider.processPayment({
      orderNumber: result.orderNumber,
      amount: Number(result.totalAmount),
      currency: 'INR',
      paymentMethod,
      paymentDetails,
    });

    if (paymentResult.success) {
      const confirmedOrder = await prisma.order.update({
        where: { id: result.id },
        data: {
          orderStatus: 'CONFIRMED',
          paymentStatus: 'PAID',
          payment: {
            create: {
              paymentMethod,
              transactionId: paymentResult.transactionId,
              amount: result.totalAmount,
              currency: 'INR',
              status: 'SUCCESS',
              providerResponse: paymentResult.rawResponse,
            },
          },
        },
        include: {
          items: true,
          payment: true,
        },
      });
      return confirmedOrder;
    } else {
      // Record failed payment; order remains PENDING with paymentStatus FAILED
      await prisma.payment.create({
        data: {
          orderId: result.id,
          paymentMethod,
          transactionId: paymentResult.transactionId,
          amount: result.totalAmount,
          currency: 'INR',
          status: 'FAILED',
          providerResponse: paymentResult.rawResponse,
        },
      });

      await prisma.order.update({
        where: { id: result.id },
        data: { paymentStatus: 'FAILED' },
      });

      const error = new Error(paymentResult.message || 'Payment was declined by payment gateway.');
      error.statusCode = 400;
      error.code = 'PAYMENT_FAILED';
      error.orderId = result.id;
      throw error;
    }
  }

  /**
   * Get user's order history
   */
  async getUserOrders(userId) {
    return prisma.order.findMany({
      where: { userId: parseInt(userId, 10) },
      include: {
        items: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get specific order details for user
   */
  async getOrderById(userId, orderId) {
    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(orderId, 10),
        userId: parseInt(userId, 10),
      },
      include: {
        items: true,
        payment: true,
      },
    });

    if (!order) {
      const error = new Error('Order not found.');
      error.statusCode = 404;
      throw error;
    }

    return order;
  }

  /**
   * Cancel Order (restores reserved inventory atomically)
   */
  async cancelOrder(userId, orderId) {
    const oId = parseInt(orderId, 10);
    const uId = parseInt(userId, 10);

    const order = await prisma.order.findFirst({
      where: { id: oId, userId: uId },
      include: { items: true },
    });

    if (!order) {
      const error = new Error('Order not found.');
      error.statusCode = 404;
      throw error;
    }

    if (!['PENDING', 'CONFIRMED'].includes(order.orderStatus)) {
      const error = new Error(`Cannot cancel order in "${order.orderStatus}" status.`);
      error.statusCode = 400;
      throw error;
    }

    // Atomically restore stock in transaction
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { increment: item.quantity },
              status: 'ACTIVE',
            },
          });
        }
      }

      return tx.order.update({
        where: { id: oId },
        data: {
          orderStatus: 'CANCELLED',
          paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : order.paymentStatus,
        },
        include: { items: true, payment: true },
      });
    });

    return cancelledOrder;
  }
}

module.exports = new OrderService();
