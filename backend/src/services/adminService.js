const prisma = require('../config/prisma');

class AdminService {
  /**
   * Comprehensive Dashboard Analytics & KPIs
   */
  async getDashboardStats() {
    const [
      totalProducts,
      activeProducts,
      outOfStockProducts,
      lowStockProducts,
      totalUsers,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      paidOrders,
      recentOrders,
      lowStockList,
    ] = await Promise.all([
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.product.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      prisma.product.count({ where: { deletedAt: null, status: 'OUT_OF_STOCK' } }),
      prisma.product.count({
        where: { deletedAt: null, stockQuantity: { lte: 5, gt: 0 } },
      }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.order.count(),
      prisma.order.count({ where: { orderStatus: 'PENDING' } }),
      prisma.order.count({ where: { orderStatus: 'DELIVERED' } }),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullName: true, email: true } },
          items: true,
          payment: true,
        },
      }),
      prisma.product.findMany({
        where: { deletedAt: null, stockQuantity: { lte: 5 } },
        take: 5,
        orderBy: { stockQuantity: 'asc' },
        include: {
          category: { select: { name: true } },
          images: { take: 1 },
        },
      }),
    ]);

    const totalRevenue = paidOrders._sum.totalAmount ? Number(paidOrders._sum.totalAmount) : 0;

    return {
      overview: {
        totalProducts,
        activeProducts,
        outOfStockProducts,
        lowStockProducts,
        totalUsers,
        totalOrders,
        pendingOrders,
        deliveredOrders,
        totalRevenue,
      },
      recentOrders,
      lowStockList,
    };
  }

  /**
   * List all orders for administrative fulfillment
   */
  async getAllOrders(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 15));
    const skip = (page - 1) * limit;
    const { orderStatus, paymentStatus, search } = query;

    const where = {};

    if (orderStatus) {
      where.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (search && search.trim()) {
      const s = search.trim();
      where.OR = [
        { orderNumber: { contains: s } },
        { user: { fullName: { contains: s } } },
        { user: { email: { contains: s } } },
      ];
    }

    const [totalCount, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true } },
          items: true,
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Get complete order details with customer and invoice breakdown
   */
  async getOrderDetails(orderId) {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId, 10) },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
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
   * Admin: Update order status & payment status
   */
  async updateOrderStatus(orderId, { orderStatus, paymentStatus }) {
    const oId = parseInt(orderId, 10);
    const order = await prisma.order.findUnique({
      where: { id: oId },
      include: { items: true },
    });

    if (!order) {
      const error = new Error('Order not found.');
      error.statusCode = 404;
      throw error;
    }

    const updateData = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    // If changing to CANCELLED and was not previously cancelled, restore stock
    if (orderStatus === 'CANCELLED' && order.orderStatus !== 'CANCELLED') {
      return prisma.$transaction(async (tx) => {
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
          data: updateData,
          include: {
            user: { select: { fullName: true, email: true } },
            items: true,
            payment: true,
          },
        });
      });
    }

    return prisma.order.update({
      where: { id: oId },
      data: updateData,
      include: {
        user: { select: { fullName: true, email: true } },
        items: true,
        payment: true,
      },
    });
  }

  /**
   * Admin: Customer Management & Lifetime Spend
   */
  async getAllUsers(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [totalCount, users] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.findMany({
        where: { role: 'USER' },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          status: true,
          createdAt: true,
          orders: {
            where: { paymentStatus: 'PAID' },
            select: { totalAmount: true },
          },
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formattedUsers = users.map((u) => {
      const totalSpend = u.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const { orders, ...rest } = u;
      return {
        ...rest,
        totalOrders: u._count.orders,
        totalSpend,
      };
    });

    return {
      users: formattedUsers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
}

module.exports = new AdminService();
