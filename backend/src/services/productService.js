const prisma = require('../config/prisma');
const { calculateOfferPrice } = require('../utils/pricing');
const { deleteFileByUrl } = require('../utils/fileStorage');

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

class ProductService {
  /**
   * Public catalog retrieval with multi-faceted filtering, searching, sorting & pagination
   */
  async getPublicProducts(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const { search, category, brand, minPrice, maxPrice, sort, inStockOnly } = query;

    const where = {
      deletedAt: null,
      status: { in: ['ACTIVE', 'OUT_OF_STOCK'] }, // allow browsing out of stock items with badge
      category: { status: 'ACTIVE' },
    };

    if (inStockOnly === 'true' || inStockOnly === true) {
      where.status = 'ACTIVE';
      where.stockQuantity = { gt: 0 };
    }

    if (category) {
      where.category = {
        slug: category,
        status: 'ACTIVE',
      };
    }

    if (brand) {
      where.brand = { equals: brand };
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { brand: { contains: searchTerm } },
      ];
    }

    if (minPrice || maxPrice) {
      where.offerPrice = {};
      if (minPrice) where.offerPrice.gte = parseFloat(minPrice);
      if (maxPrice) where.offerPrice.lte = parseFloat(maxPrice);
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_asc') {
      orderBy = { offerPrice: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { offerPrice: 'desc' };
    } else if (sort === 'discount') {
      orderBy = { discountPercent: 'desc' };
    } else if (sort === 'name_asc') {
      orderBy = { name: 'asc' };
    }

    const [totalCount, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }] },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      products,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get single product by ID or Slug
   */
  async getProductByIdOrSlug(identifier) {
    const isNumeric = !isNaN(identifier) && !isNaN(parseFloat(identifier));

    const where = isNumeric
      ? { id: parseInt(identifier, 10), deletedAt: null }
      : { slug: identifier, deletedAt: null };

    const product = await prisma.product.findFirst({
      where,
      include: {
        category: true,
        images: { orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }] },
      },
    });

    if (!product) {
      const error = new Error('Product not found.');
      error.statusCode = 404;
      error.code = 'PRODUCT_NOT_FOUND';
      throw error;
    }

    return product;
  }

  /**
   * Admin: List all products (including Inactive and Out of Stock)
   */
  async getAdminProducts(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { search, categoryId, status } = query;

    const where = { deletedAt: null };

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId, 10);
    }

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim() } },
        { sku: { contains: search.trim() } },
        { brand: { contains: search.trim() } },
      ];
    }

    const [totalCount, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }] },
          _count: { select: { orderItems: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Admin: Create Product
   */
  async createProduct(data, files = []) {
    const {
      name,
      description,
      brand,
      sku,
      price,
      discountPercent = 0,
      stockQuantity = 0,
      categoryId,
      status = 'ACTIVE',
    } = data;

    if (!name || !name.trim()) {
      const error = new Error('Product name is required.');
      error.statusCode = 400;
      throw error;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      const error = new Error('Product price must be a positive number.');
      error.statusCode = 400;
      throw error;
    }

    const numDiscount = Math.max(0, Math.min(100, parseFloat(discountPercent) || 0));
    const numStock = Math.max(0, parseInt(stockQuantity, 10) || 0);
    const catId = parseInt(categoryId, 10);

    // Validate category
    const category = await prisma.category.findUnique({ where: { id: catId } });
    if (!category) {
      const error = new Error('Selected category does not exist.');
      error.statusCode = 400;
      throw error;
    }

    // Validate SKU
    const existingSku = await prisma.product.findUnique({ where: { sku: sku.trim() } });
    if (existingSku) {
      const error = new Error(`SKU "${sku.trim()}" is already assigned to another product.`);
      error.statusCode = 409;
      throw error;
    }

    // Slug generation
    let baseSlug = slugify(name);
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Recalculate offer price server-side
    const offerPrice = calculateOfferPrice(numPrice, numDiscount);
    const finalStatus = numStock === 0 ? 'OUT_OF_STOCK' : status;

    const newProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description ? description.trim() : '',
        brand: brand ? brand.trim() : null,
        sku: sku.trim(),
        price: numPrice,
        discountPercent: numDiscount,
        offerPrice,
        stockQuantity: numStock,
        status: finalStatus,
        categoryId: catId,
      },
    });

    // Save uploaded image files if provided
    if (files && files.length > 0) {
      const imageRecords = files.map((file, idx) => ({
        productId: newProduct.id,
        imageUrl: `/uploads/products/${file.filename}`,
        isPrimary: idx === 0,
        displayOrder: idx,
      }));

      await prisma.productImage.createMany({
        data: imageRecords,
      });
    }

    return this.getProductByIdOrSlug(newProduct.id);
  }

  /**
   * Admin: Update Product
   */
  async updateProduct(id, data) {
    const product = await prisma.product.findUnique({ where: { id: parseInt(id, 10) } });
    if (!product) {
      const error = new Error('Product not found.');
      error.statusCode = 404;
      throw error;
    }

    const updateData = {};

    if (data.name && data.name.trim()) {
      updateData.name = data.name.trim();
      let baseSlug = slugify(data.name);
      let finalSlug = baseSlug;
      let counter = 1;
      while (
        await prisma.product.findFirst({
          where: { slug: finalSlug, id: { not: parseInt(id, 10) } },
        })
      ) {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      updateData.slug = finalSlug;
    }

    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.brand !== undefined) updateData.brand = data.brand ? data.brand.trim() : null;

    if (data.sku && data.sku.trim()) {
      const conflict = await prisma.product.findFirst({
        where: { sku: data.sku.trim(), id: { not: parseInt(id, 10) } },
      });
      if (conflict) {
        const error = new Error(`SKU "${data.sku.trim()}" is already assigned to another product.`);
        error.statusCode = 409;
        throw error;
      }
      updateData.sku = data.sku.trim();
    }

    if (data.categoryId) {
      const catId = parseInt(data.categoryId, 10);
      const category = await prisma.category.findUnique({ where: { id: catId } });
      if (!category) {
        const error = new Error('Category not found.');
        error.statusCode = 400;
        throw error;
      }
      updateData.categoryId = catId;
    }

    // Pricing recalculation
    const currentPrice = data.price !== undefined ? parseFloat(data.price) : Number(product.price);
    const currentDiscount =
      data.discountPercent !== undefined
        ? parseFloat(data.discountPercent)
        : Number(product.discountPercent);

    if (data.price !== undefined || data.discountPercent !== undefined) {
      if (isNaN(currentPrice) || currentPrice <= 0) {
        const error = new Error('Price must be greater than 0.');
        error.statusCode = 400;
        throw error;
      }
      const safeDiscount = Math.max(0, Math.min(100, currentDiscount || 0));
      updateData.price = currentPrice;
      updateData.discountPercent = safeDiscount;
      updateData.offerPrice = calculateOfferPrice(currentPrice, safeDiscount);
    }

    if (data.stockQuantity !== undefined) {
      const newStock = Math.max(0, parseInt(data.stockQuantity, 10));
      updateData.stockQuantity = newStock;
      if (newStock === 0) {
        updateData.status = 'OUT_OF_STOCK';
      } else if (product.status === 'OUT_OF_STOCK' && newStock > 0) {
        updateData.status = 'ACTIVE';
      }
    }

    if (data.status) {
      updateData.status = data.status;
    }

    await prisma.product.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
    });

    return this.getProductByIdOrSlug(id);
  }

  /**
   * Admin: Update Stock & Status
   */
  async updateStock(id, { quantity, action = 'SET' }) {
    const product = await prisma.product.findUnique({ where: { id: parseInt(id, 10) } });
    if (!product) {
      const error = new Error('Product not found.');
      error.statusCode = 404;
      throw error;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty)) {
      const error = new Error('Invalid quantity provided.');
      error.statusCode = 400;
      throw error;
    }

    let finalStock = product.stockQuantity;
    if (action === 'SET') {
      finalStock = Math.max(0, qty);
    } else if (action === 'INCREASE') {
      finalStock += Math.max(0, qty);
    } else if (action === 'DECREASE') {
      finalStock = Math.max(0, finalStock - Math.max(0, qty));
    }

    let nextStatus = product.status;
    if (finalStock === 0) {
      nextStatus = 'OUT_OF_STOCK';
    } else if (product.status === 'OUT_OF_STOCK' && finalStock > 0) {
      nextStatus = 'ACTIVE';
    }

    return prisma.product.update({
      where: { id: parseInt(id, 10) },
      data: {
        stockQuantity: finalStock,
        status: nextStatus,
      },
      include: { category: true, images: true },
    });
  }

  /**
   * Admin: Update Product Status (ACTIVE, INACTIVE, OUT_OF_STOCK)
   */
  async updateStatus(id, status) {
    const product = await prisma.product.findUnique({ where: { id: parseInt(id, 10) } });
    if (!product) {
      const error = new Error('Product not found.');
      error.statusCode = 404;
      throw error;
    }

    if (!['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'].includes(status)) {
      const error = new Error('Invalid product status.');
      error.statusCode = 400;
      throw error;
    }

    return prisma.product.update({
      where: { id: parseInt(id, 10) },
      data: { status },
      include: { category: true, images: true },
    });
  }

  /**
   * Admin: Delete Product (Soft delete if historical orders exist, hard delete otherwise)
   */
  async deleteProduct(id) {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        images: true,
        _count: { select: { orderItems: true } },
      },
    });

    if (!product) {
      const error = new Error('Product not found.');
      error.statusCode = 404;
      throw error;
    }

    if (product._count.orderItems > 0) {
      // Historical orders exist: preserve database integrity with Soft Delete
      await prisma.product.update({
        where: { id: parseInt(id, 10) },
        data: {
          deletedAt: new Date(),
          status: 'INACTIVE',
        },
      });
      return { message: 'Product has historical orders and was safely archived (soft deleted).' };
    }

    // Delete image files on disk
    for (const img of product.images) {
      deleteFileByUrl(img.imageUrl);
    }

    await prisma.product.delete({
      where: { id: parseInt(id, 10) },
    });

    return { message: 'Product and associated assets permanently deleted.' };
  }

  /**
   * Admin: Upload Additional Images to Product
   */
  async addProductImages(productId, files) {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId, 10) },
      include: { images: true },
    });

    if (!product) {
      const error = new Error('Product not found.');
      error.statusCode = 404;
      throw error;
    }

    const currentImageCount = product.images.length;
    const newImages = files.map((file, idx) => ({
      productId: product.id,
      imageUrl: `/uploads/products/${file.filename}`,
      isPrimary: currentImageCount === 0 && idx === 0,
      displayOrder: currentImageCount + idx,
    }));

    await prisma.productImage.createMany({ data: newImages });

    return this.getProductByIdOrSlug(product.id);
  }

  /**
   * Admin: Delete specific product image
   */
  async deleteProductImage(productId, imageId) {
    const image = await prisma.productImage.findFirst({
      where: {
        id: parseInt(imageId, 10),
        productId: parseInt(productId, 10),
      },
    });

    if (!image) {
      const error = new Error('Image not found.');
      error.statusCode = 404;
      throw error;
    }

    // Delete file from disk
    deleteFileByUrl(image.imageUrl);

    // Delete DB record
    await prisma.productImage.delete({ where: { id: image.id } });

    // If it was primary, promote another image
    if (image.isPrimary) {
      const nextImg = await prisma.productImage.findFirst({
        where: { productId: parseInt(productId, 10) },
        orderBy: { displayOrder: 'asc' },
      });
      if (nextImg) {
        await prisma.productImage.update({
          where: { id: nextImg.id },
          data: { isPrimary: true },
        });
      }
    }

    return this.getProductByIdOrSlug(productId);
  }
}

module.exports = new ProductService();
