const categoryService = require('../services/categoryService');
const { successResponse } = require('../utils/response');

class CategoryController {
  async getPublicCategories(req, res, next) {
    try {
      const categories = await categoryService.getPublicCategories();
      return successResponse(res, categories, 'Active categories retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async getAllCategories(req, res, next) {
    try {
      const categories = await categoryService.getAllCategories();
      return successResponse(res, categories, 'All categories retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async getCategoryBySlug(req, res, next) {
    try {
      const category = await categoryService.getCategoryBySlug(req.params.slug);
      return successResponse(res, category, 'Category retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const { name, description, status } = req.body;
      const category = await categoryService.createCategory({ name, description, status });
      return successResponse(res, category, 'Category created successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);
      return successResponse(res, category, 'Category updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      await categoryService.deleteCategory(req.params.id);
      return successResponse(res, null, 'Category deleted successfully.');
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const category = await categoryService.toggleStatus(req.params.id);
      return successResponse(res, category, 'Category status toggled.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();
