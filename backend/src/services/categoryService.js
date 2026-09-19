const prisma = require('../config/prisma');

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

class CategoryService {
  async getPublicCategories() {
    return prisma.category.findMany({
      where: { status: 'ACTIVE' },
      include: {
        _count: {
          select: { products: { where: { deletedAt: null, status: 'ACTIVE' } } },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getAllCategories() {
    return prisma.category.findMany({
      include: {
        _count: {
          select: { products: { where: { deletedAt: null } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCategoryBySlug(slug) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: { where: { deletedAt: null } } },
        },
      },
    });

    if (!category) {
      const error = new Error('Category not found.');
      error.statusCode = 404;
      error.code = 'CATEGORY_NOT_FOUND';
      throw error;
    }
    return category;
  }

  async createCategory({ name, description, status = 'ACTIVE' }) {
    if (!name || !name.trim()) {
      const error = new Error('Category name is required.');
      error.statusCode = 400;
      error.code = 'INVALID_INPUT';
      throw error;
    }

    const slug = slugify(name);
    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name: name.trim() }, { slug }],
      },
    });

    if (existing) {
      const error = new Error('A category with this name or slug already exists.');
      error.statusCode = 409;
      error.code = 'CATEGORY_ALREADY_EXISTS';
      throw error;
    }

    return prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description ? description.trim() : null,
        status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      },
    });
  }

  async updateCategory(id, { name, description, status }) {
    const category = await prisma.category.findUnique({ where: { id: Number(id) } });
    if (!category) {
      const error = new Error('Category not found.');
      error.statusCode = 404;
      error.code = 'CATEGORY_NOT_FOUND';
      throw error;
    }

    const data = {};
    if (name) {
      data.name = name.trim();
      data.slug = slugify(name);

      const conflict = await prisma.category.findFirst({
        where: {
          id: { not: Number(id) },
          OR: [{ name: data.name }, { slug: data.slug }],
        },
      });

      if (conflict) {
        const error = new Error('A category with this name already exists.');
        error.statusCode = 409;
        error.code = 'CATEGORY_ALREADY_EXISTS';
        throw error;
      }
    }

    if (description !== undefined) {
      data.description = description ? description.trim() : null;
    }

    if (status) {
      data.status = status;
    }

    return prisma.category.update({
      where: { id: Number(id) },
      data,
    });
  }

  async deleteCategory(id) {
    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: { products: { where: { deletedAt: null } } },
        },
      },
    });

    if (!category) {
      const error = new Error('Category not found.');
      error.statusCode = 404;
      error.code = 'CATEGORY_NOT_FOUND';
      throw error;
    }

    if (category._count.products > 0) {
      const error = new Error(
        `Cannot delete category "${category.name}" because it has ${category._count.products} associated product(s). Reassign or remove these products first.`
      );
      error.statusCode = 400;
      error.code = 'CATEGORY_HAS_PRODUCTS';
      throw error;
    }

    return prisma.category.delete({
      where: { id: Number(id) },
    });
  }

  async toggleStatus(id) {
    const category = await prisma.category.findUnique({ where: { id: Number(id) } });
    if (!category) {
      const error = new Error('Category not found.');
      error.statusCode = 404;
      error.code = 'CATEGORY_NOT_FOUND';
      throw error;
    }

    const nextStatus = category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return prisma.category.update({
      where: { id: Number(id) },
      data: { status: nextStatus },
    });
  }
}

module.exports = new CategoryService();
