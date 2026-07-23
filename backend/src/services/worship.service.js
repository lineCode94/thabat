import { prisma } from '#lib/prisma.js';
import { ApiError } from '#utils/apiError.js';

export class WorshipService {
  // Category CRUD
  static async getCategories(includeInactive = false) {
    const where = includeInactive ? { deletedAt: null } : { isActive: true, deletedAt: null };
    return prisma.worshipCategory.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  static async getCategoryById(id) {
    const category = await prisma.worshipCategory.findUnique({
      where: { id },
    });
    if (!category || category.deletedAt) {
      throw ApiError.notFound('Category not found');
    }
    return category;
  }

  static async createCategory(data) {
    return prisma.worshipCategory.create({
      data,
    });
  }

  static async updateCategory(id, data) {
    await this.getCategoryById(id);
    return prisma.worshipCategory.update({
      where: { id },
      data,
    });
  }

  static async deleteCategory(id) {
    await this.getCategoryById(id);
    return prisma.worshipCategory.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  // Worship Item CRUD
  static async getItems(includeInactive = false) {
    const where = includeInactive ? { deletedAt: null } : { isActive: true, deletedAt: null };
    return prisma.worshipItem.findMany({
      where,
      include: {
        category: true,
        levelRequirements: {
          include: {
            worshipLevel: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  static async getItemById(id) {
    const item = await prisma.worshipItem.findUnique({
      where: { id },
      include: {
        category: true,
        levelRequirements: {
          include: {
            worshipLevel: true,
          },
        },
      },
    });
    if (!item || item.deletedAt) {
      throw ApiError.notFound('Worship Item not found');
    }
    return item;
  }

  static async createItem(data) {
    return prisma.worshipItem.create({
      data,
      include: {
        category: true,
        levelRequirements: {
          include: {
            worshipLevel: true,
          },
        },
      },
    });
  }

  static async updateItem(id, data) {
    await this.getItemById(id);
    return prisma.worshipItem.update({
      where: { id },
      data,
      include: {
        category: true,
        levelRequirements: {
          include: {
            worshipLevel: true,
          },
        },
      },
    });
  }

  static async deleteItem(id) {
    await this.getItemById(id);
    return prisma.worshipItem.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  static async setDefaultLevelRequirement(itemId, isRequired) {
    await this.getItemById(itemId);

    const level = await prisma.worshipLevel.findFirst({
      where: { isActive: true, deletedAt: null },
      orderBy: { order: 'asc' },
    });

    if (!level) {
      throw ApiError.conflict('No active worship level is configured', 'NO_ACTIVE_WORSHIP_LEVEL');
    }

    if (isRequired) {
      await prisma.levelRequirement.upsert({
        where: {
          levelId_worshipItemId: {
            levelId: level.id,
            worshipItemId: itemId,
          },
        },
        update: {},
        create: {
          levelId: level.id,
          worshipItemId: itemId,
        },
      });
    } else {
      await prisma.levelRequirement.deleteMany({
        where: {
          levelId: level.id,
          worshipItemId: itemId,
        },
      });
    }

    return this.getItemById(itemId);
  }
}
