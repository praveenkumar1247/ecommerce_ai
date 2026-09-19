const prisma = require('../config/prisma');
const { calculateOrderTotals } = require('../utils/pricing');

class CartService {
  /**
   * Ensure user has a cart record
   */
  async getOrCreateCart(userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId: parseInt(userId, 10) },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: parseInt(userId, 10) },
      });
    }

    return cart;
  }

  /**
   * Get user's cart with latest calculated prices, stock warning flags, and totals
   */
  async getCart(userId) {
    const cart = await this.getOrCreateCart(userId);

    const cartItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          include: {
            images: { orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }] },
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Format items with stock status warning
    let hasStockIssue = false;
    const formattedItems = cartItems.map((item) => {
      const product = item.product;
      const isAvailable =
        product &&
        product.deletedAt === null &&
        product.status === 'ACTIVE' &&
        product.stockQuantity >= item.quantity;

      const stockWarning = !isAvailable
        ? product.stockQuantity === 0
          ? 'Out of stock'
          : `Only ${product.stockQuantity} remaining`
        : null;

      if (!isAvailable) {
        hasStockIssue = true;
      }

      return {
        id: item.id,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        sku: product.sku,
        price: Number(product.price),
        discountPercent: Number(product.discountPercent),
        offerPrice: Number(product.offerPrice),
        quantity: item.quantity,
        stockQuantity: product.stockQuantity,
        isAvailable,
        stockWarning,
        image: product.images[0]?.imageUrl || null,
        itemSubtotal: Number(product.offerPrice) * item.quantity,
      };
    });

    // Server-side calculation of order totals
    const financialSummary = calculateOrderTotals(formattedItems);

    return {
      cartId: cart.id,
      items: formattedItems,
      totalItems: formattedItems.reduce((acc, item) => acc + item.quantity, 0),
      hasStockIssue,
      summary: financialSummary,
    };
  }

  /**
   * Add item to cart
   */
  async addItem(userId, { productId, quantity = 1 }) {
    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);
    const prodId = parseInt(productId, 10);

    const product = await prisma.product.findUnique({
      where: { id: prodId, deletedAt: null },
    });

    if (!product) {
      const error = new Error('Product does not exist or has been removed.');
      error.statusCode = 404;
      error.code = 'PRODUCT_NOT_FOUND';
      throw error;
    }

    if (product.status !== 'ACTIVE' || product.stockQuantity <= 0) {
      const error = new Error(`"${product.name}" is currently out of stock.`);
      error.statusCode = 400;
      error.code = 'OUT_OF_STOCK';
      throw error;
    }

    const cart = await this.getOrCreateCart(userId);

    // Check if product is already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: product.id,
        },
      },
    });

    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
    const newTotalQty = currentQtyInCart + qtyToAdd;

    if (newTotalQty > product.stockQuantity) {
      const error = new Error(
        `Cannot add ${qtyToAdd} more item(s). Available stock is ${product.stockQuantity} (You already have ${currentQtyInCart} in your cart).`
      );
      error.statusCode = 400;
      error.code = 'INSUFFICIENT_STOCK';
      throw error;
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newTotalQty,
          priceSnapshot: product.offerPrice,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: qtyToAdd,
          priceSnapshot: product.offerPrice,
        },
      });
    }

    return this.getCart(userId);
  }

  /**
   * Update item quantity in cart
   */
  async updateItem(userId, cartItemId, { quantity }) {
    const newQty = parseInt(quantity, 10);
    const cItemId = parseInt(cartItemId, 10);

    if (isNaN(newQty) || newQty <= 0) {
      const error = new Error('Quantity must be at least 1.');
      error.statusCode = 400;
      throw error;
    }

    const cart = await this.getOrCreateCart(userId);

    const item = await prisma.cartItem.findFirst({
      where: {
        id: cItemId,
        cartId: cart.id,
      },
      include: { product: true },
    });

    if (!item) {
      const error = new Error('Cart item not found.');
      error.statusCode = 404;
      throw error;
    }

    if (newQty > item.product.stockQuantity) {
      const error = new Error(
        `Requested quantity (${newQty}) exceeds available stock (${item.product.stockQuantity}).`
      );
      error.statusCode = 400;
      error.code = 'INSUFFICIENT_STOCK';
      throw error;
    }

    await prisma.cartItem.update({
      where: { id: item.id },
      data: {
        quantity: newQty,
        priceSnapshot: item.product.offerPrice,
      },
    });

    return this.getCart(userId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId, cartItemId) {
    const cart = await this.getOrCreateCart(userId);
    const cItemId = parseInt(cartItemId, 10);

    await prisma.cartItem.deleteMany({
      where: {
        id: cItemId,
        cartId: cart.id,
      },
    });

    return this.getCart(userId);
  }

  /**
   * Clear user's entire cart
   */
  async clearCart(userId) {
    const cart = await this.getOrCreateCart(userId);
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { message: 'Cart cleared successfully.', items: [], totalItems: 0 };
  }

  /**
   * Fresh real-time validation of cart before checkout
   */
  async validateCart(userId) {
    const cart = await this.getCart(userId);
    const issues = [];

    for (const item of cart.items) {
      if (!item.isAvailable) {
        issues.push({
          productId: item.productId,
          name: item.name,
          requestedQty: item.quantity,
          availableStock: item.stockQuantity,
          reason: item.stockQuantity === 0 ? 'Item is out of stock' : 'Insufficient stock',
        });
      }
    }

    return {
      isValid: issues.length === 0,
      cart,
      issues,
    };
  }
}

module.exports = new CartService();
