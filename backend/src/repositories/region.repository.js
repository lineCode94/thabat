import { prisma } from '#lib/prisma.js';

export class RegionRepository {
  static findMany({ where = {}, orderBy = { name: 'asc' } } = {}) {
    return prisma.region.findMany({
      where,
      orderBy,
    });
  }

  static findById(id) {
    return prisma.region.findUnique({
      where: { id },
    });
  }

  static create(data) {
    return prisma.region.create({
      data,
    });
  }

  static update(id, data) {
    return prisma.region.update({
      where: { id },
      data,
    });
  }

  static softDelete(id) {
    return prisma.region.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  static countUsers(id) {
    return prisma.user.count({
      where: {
        regionId: id,
        deletedAt: null,
      },
    });
  }

  static countUsersByRegionIds(regionIds = []) {
    if (regionIds.length === 0) {
      return [];
    }

    return prisma.user.groupBy({
      by: ['regionId'],
      where: {
        regionId: { in: regionIds },
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });
  }
}
