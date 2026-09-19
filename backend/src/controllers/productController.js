const productService = require('../services/productService');
const { successResponse } = require('../utils/response');

class ProductController {
  async getPublicProducts(req, res, next) {
    try {
      const result = await productService.getPublicProducts(req.query);
      return successResponse(res, result.products, 'Products retrieved successfully.', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getProductByIdOrSlug(req, res, next) {
    try {
      const product = await productService.getProductByIdOrSlug(req.params.idOrSlug);
      return successResponse(res, product, 'Product details retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async getAdminProducts(req, res, next) {
    try {
      const result = await productService.getAdminProducts(req.query);
      return successResponse(res, result.products, 'Admin products retrieved.', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const product = await productService.createProduct(req.body, req.files);
      return successResponse(res, product, 'Product created successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      return successResponse(res, product, 'Product updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req, res, next) {
    try {
      const { quantity, action } = req.body;
      const product = await productService.updateStock(req.params.id, { quantity, action });
      return successResponse(res, product, 'Product stock updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const product = await productService.updateStatus(req.params.id, status);
      return successResponse(res, product, 'Product status updated.');
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const result = await productService.deleteProduct(req.params.id);
      return successResponse(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async addProductImages(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide at least one image file.',
          code: 'NO_FILES_PROVIDED',
        });
      }
      const product = await productService.addProductImages(req.params.id, req.files);
      return successResponse(res, product, 'Images uploaded successfully.');
    } catch (error) {
      next(error);
    }
  }

  async deleteProductImage(req, res, next) {
    try {
      const product = await productService.deleteProductImage(req.params.id, req.params.imageId);
      return successResponse(res, product, 'Product image deleted.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
