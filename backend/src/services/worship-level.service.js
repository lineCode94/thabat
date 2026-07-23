import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '#constants/auditLog.js';
import { PERMISSIONS, ROLES } from '#constants/permissionRegistry.js';
import { prisma } from '#lib/prisma.js';
import { AuditLogService } from '#services/audit-log.service.js';
import { AuthorizationService } from '#services/authorization.service.js';
import { ApiError } from '#utils/apiError.js';

const LEVEL_INCLUDE = {
  _count: {
    select: {
      requirements: true,
      userLevels: true,
    },
  },
};

function toDto(level) {
  return {
    ...level,
    requirementsCount: level._count?.requirements ?? 0,
    userLevelsCount: level._count?.userLevels ?? 0,
    _count: undefined,
  };
}

function can(permissionBag, permission) {
  return AuthorizationService.hasPermission(permissionBag, permission);
}

function normalizeWorshipItem(item) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    inputType: item.inputType,
    targetValue: item.targetValue,
    daysOfWeek: item.daysOfWeek,
    order: item.order,
    score: item.score,
    xp: item.xp,
    category: item.category ? {
      id: item.category.id,
      name: item.category.name,
      order: item.category.order,
    } : null,
  };
}

async function assertCanAssignUser(actor, permissions, user) {
  const permissionBag = { ...actor, permissions };

  if (can(permissionBag, PERMISSIONS.USERS_MANAGE_ALL)) return;

  if (
    can(permissionBag, PERMISSIONS.USERS_MANAGE_REGION) &&
    AuthorizationService.isSameRegion(actor, user.regionId)
  ) {
    return;
  }

  if (
    can(permissionBag, PERMISSIONS.USERS_VIEW_ASSIGNED) &&
    await AuthorizationService.isAssignedUser(actor.id, user.id)
  ) {
    return;
  }

  throw ApiError.forbidden('Cannot assign worship levels for this user');
}

export class WorshipLevelService {
  static async findMany({ includeInactive = false } = {}) {
    const levels = await prisma.worshipLevel.findMany({
      where: includeInactive ? { deletedAt: null } : { isActive: true, deletedAt: null },
      include: LEVEL_INCLUDE,
      orderBy: { order: 'asc' },
    });

    return levels.map(toDto);
  }

  static async findById(id) {
    const level = await prisma.worshipLevel.findUnique({
      where: { id },
      include: LEVEL_INCLUDE,
    });

    if (!level || level.deletedAt) {
      throw ApiError.notFound('Worship level not found');
    }

    return toDto(level);
  }

  static async assertUnique({ name, order, ignoreId = null }) {
    const existing = await prisma.worshipLevel.findFirst({
      where: {
        deletedAt: null,
        ...(ignoreId ? { id: { not: ignoreId } } : {}),
        OR: [
          ...(name ? [{ name }] : []),
          ...(order !== undefined ? [{ order }] : []),
        ],
      },
      select: { id: true, name: true, order: true },
    });

    if (!existing) return;

    if (name && existing.name === name) {
      throw ApiError.conflict('A worship level with this name already exists', 'WORSHIP_LEVEL_NAME_EXISTS');
    }

    throw ApiError.conflict('A worship level with this order already exists', 'WORSHIP_LEVEL_ORDER_EXISTS');
  }

  static async create(data) {
    await this.assertUnique({ name: data.name, order: data.order });

    const level = await prisma.worshipLevel.create({
      data,
      include: LEVEL_INCLUDE,
    });

    return toDto(level);
  }

  static async update(id, data) {
    await this.findById(id);
    await this.assertUnique({ name: data.name, order: data.order, ignoreId: id });

    const level = await prisma.worshipLevel.update({
      where: { id },
      data,
      include: LEVEL_INCLUDE,
    });

    return toDto(level);
  }

  static async deactivate(id) {
    const level = await this.findById(id);
    const activeUsers = await prisma.userLevel.count({
      where: { levelId: id, isActive: true },
    });

    if (activeUsers > 0) {
      throw ApiError.conflict(
        'This worship level still has active users',
        'WORSHIP_LEVEL_HAS_ACTIVE_USERS',
        { activeUsers },
      );
    }

    if (!level.isActive) return level;

    const updated = await prisma.worshipLevel.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
      include: LEVEL_INCLUDE,
    });

    return toDto(updated);
  }

  static async findAssignableUsers({ actor, permissions, search = '' } = {}) {
    const permissionBag = { ...actor, permissions };
    const where = {
      deletedAt: null,
      isActive: true,
      role: { code: ROLES.USER },
      ...(search ? {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    if (can(permissionBag, PERMISSIONS.USERS_MANAGE_ALL)) {
      // unrestricted
    } else if (can(permissionBag, PERMISSIONS.USERS_MANAGE_REGION)) {
      where.regionId = actor.regionId;
    } else if (can(permissionBag, PERMISSIONS.USERS_VIEW_ASSIGNED)) {
      where.mentorAssignmentsAsStudent = {
        some: {
          mentorId: actor.id,
          isActive: true,
        },
      };
    } else {
      throw ApiError.forbidden('Insufficient permissions');
    }

    return prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        region: { select: { id: true, name: true } },
        userLevels: {
          where: { isActive: true },
          select: {
            id: true,
            worshipLevel: { select: { id: true, name: true, order: true } },
          },
          take: 1,
        },
      },
      orderBy: { fullName: 'asc' },
      take: 20,
    });
  }

  static async assignUsers(levelId, userIds, { actor, permissions } = {}) {
    const level = await this.findById(levelId);
    if (!level.isActive) {
      throw ApiError.badRequest('Cannot assign inactive worship level', 'WORSHIP_LEVEL_INACTIVE');
    }

    const uniqueUserIds = [...new Set(userIds)];
    const users = await prisma.user.findMany({
      where: {
        id: { in: uniqueUserIds },
        deletedAt: null,
        isActive: true,
        role: { code: ROLES.USER },
      },
      include: {
        userLevels: {
          where: { isActive: true },
          include: { worshipLevel: true },
        },
      },
    });

    if (users.length !== uniqueUserIds.length) {
      throw ApiError.badRequest('One or more users are not valid for worship level assignment', 'INVALID_LEVEL_USERS');
    }

    for (const user of users) {
      await assertCanAssignUser(actor, permissions, user);
    }

    const assigned = [];
    const auditLogs = [];
    await prisma.$transaction(async (tx) => {
      for (const user of users) {
        const currentLevel = user.userLevels[0]?.worshipLevel ?? null;

        await tx.userLevel.updateMany({
          where: { userId: user.id, isActive: true },
          data: { isActive: false },
        });

        const userLevel = await tx.userLevel.create({
          data: {
            userId: user.id,
            levelId,
            isActive: true,
            promotedById: actor?.id ?? null,
          },
          include: { worshipLevel: true, user: { select: { id: true, fullName: true, email: true, regionId: true } } },
        });

        assigned.push(userLevel);

        auditLogs.push({
          actorId: actor?.id,
          action: AUDIT_ACTIONS.WORSHIP_LEVEL_ASSIGNED,
          targetType: AUDIT_TARGET_TYPES.USER,
          targetId: user.id,
          regionId: user.regionId,
          metadata: {
            fromLevelId: currentLevel?.id ?? null,
            toLevelId: levelId,
          },
        });
      }
    });

    await Promise.all(auditLogs.map((auditLog) => AuditLogService.record(auditLog)));

    return assigned;
  }

  static async getUserCustomSchedule(userId, { actor, permissions, allowSelf = false } = {}) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
        isActive: true,
        role: { code: ROLES.USER },
      },
      include: {
        region: { select: { id: true, name: true } },
        userLevels: {
          where: { isActive: true },
          include: { worshipLevel: true },
          take: 1,
        },
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (!(allowSelf && actor?.id === user.id)) {
      await assertCanAssignUser(actor, permissions, user);
    }

    const activeUserLevel = user.userLevels[0] ?? null;
    if (!activeUserLevel) {
      throw ApiError.conflict('User has no active worship level', 'NO_ACTIVE_WORSHIP_LEVEL');
    }

    const [levelRequirements, customRequirements, excludedRequirements, availableItems] = await Promise.all([
      prisma.levelRequirement.findMany({
        where: { levelId: activeUserLevel.levelId },
        include: {
          worshipItem: { include: { category: true } },
        },
        orderBy: [
          { worshipItem: { category: { order: 'asc' } } },
          { worshipItem: { order: 'asc' } },
        ],
      }),
      prisma.userCustomRequirement.findMany({
        where: { userId },
        include: {
          worshipItem: { include: { category: true } },
        },
        orderBy: [
          { worshipItem: { category: { order: 'asc' } } },
          { worshipItem: { order: 'asc' } },
        ],
      }),
      prisma.userExcludedRequirement.findMany({
        where: { userId },
        select: { worshipItemId: true },
      }),
      prisma.worshipItem.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          OR: [
            { createdByUserId: null },
            { createdByUserId: userId },
          ],
          category: { isActive: true, deletedAt: null },
        },
        include: { category: true },
        orderBy: [
          { category: { order: 'asc' } },
          { order: 'asc' },
        ],
      }),
    ]);

    const baseItems = levelRequirements.map((requirement) => requirement.worshipItem).filter(Boolean);
    const customItems = customRequirements.map((requirement) => requirement.worshipItem).filter(Boolean);
    const excludedItemIds = excludedRequirements.map((requirement) => requirement.worshipItemId);
    const excludedSet = new Set(excludedItemIds);
    const finalItemsById = new Map();

    baseItems.forEach((item) => {
      if (!excludedSet.has(item.id)) {
        finalItemsById.set(item.id, item);
      }
    });

    customItems.forEach((item) => {
      finalItemsById.set(item.id, item);
    });

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        region: user.region,
      },
      level: {
        id: activeUserLevel.worshipLevel.id,
        name: activeUserLevel.worshipLevel.name,
        order: activeUserLevel.worshipLevel.order,
      },
      baseItemIds: baseItems.map((item) => item.id),
      customItemIds: customItems.map((item) => item.id),
      excludedItemIds,
      finalItems: [...finalItemsById.values()].map(normalizeWorshipItem),
      availableItems: availableItems.map(normalizeWorshipItem),
    };
  }

  static async updateUserCustomSchedule(userId, { customItemIds = [], excludedItemIds = [] }, { actor, permissions, allowSelf = false } = {}) {
    const currentSchedule = await this.getUserCustomSchedule(userId, { actor, permissions, allowSelf });
    const uniqueCustomItemIds = [...new Set(customItemIds)];
    const uniqueExcludedItemIds = [...new Set(excludedItemIds)];
    const allItemIds = [...new Set([...uniqueCustomItemIds, ...uniqueExcludedItemIds])];

    if (allItemIds.length > 0) {
      const validItemCount = await prisma.worshipItem.count({
        where: {
          id: { in: allItemIds },
          isActive: true,
          deletedAt: null,
          category: { isActive: true, deletedAt: null },
        },
      });

      if (validItemCount !== allItemIds.length) {
        throw ApiError.badRequest('One or more worship items are invalid', 'INVALID_WORSHIP_ITEMS');
      }
    }

    const baseItemIdSet = new Set(currentSchedule.baseItemIds);
    const normalizedCustomItemIds = uniqueCustomItemIds.filter((itemId) => !baseItemIdSet.has(itemId));
    const normalizedExcludedItemIds = uniqueExcludedItemIds.filter((itemId) => baseItemIdSet.has(itemId));

    await prisma.$transaction(async (tx) => {
      await tx.userCustomRequirement.deleteMany({ where: { userId } });
      await tx.userExcludedRequirement.deleteMany({ where: { userId } });

      if (normalizedCustomItemIds.length > 0) {
        await tx.userCustomRequirement.createMany({
          data: normalizedCustomItemIds.map((worshipItemId) => ({ userId, worshipItemId })),
          skipDuplicates: true,
        });
      }

      if (normalizedExcludedItemIds.length > 0) {
        await tx.userExcludedRequirement.createMany({
          data: normalizedExcludedItemIds.map((worshipItemId) => ({ userId, worshipItemId })),
          skipDuplicates: true,
        });
      }
    });

    await AuditLogService.record({
      actorId: actor?.id,
      action: AUDIT_ACTIONS.WORSHIP_SCHEDULE_CUSTOMIZED,
      targetType: AUDIT_TARGET_TYPES.USER,
      targetId: userId,
      regionId: currentSchedule.user.region?.id ?? actor?.regionId ?? null,
      metadata: {
        before: {
          customItemIds: currentSchedule.customItemIds,
          excludedItemIds: currentSchedule.excludedItemIds,
        },
        after: {
          customItemIds: normalizedCustomItemIds,
          excludedItemIds: normalizedExcludedItemIds,
        },
      },
    });

    return this.getUserCustomSchedule(userId, { actor, permissions, allowSelf });
  }

  static async createUserCustomWorshipItem(userId, { title, categoryId }, { actor, permissions, allowSelf = false } = {}) {
    const currentSchedule = await this.getUserCustomSchedule(userId, { actor, permissions, allowSelf });
    const category = await prisma.worshipCategory.findFirst({
      where: {
        id: categoryId,
        isActive: true,
        deletedAt: null,
      },
      select: { id: true, order: true },
    });

    if (!category) {
      throw ApiError.badRequest('Invalid worship category', 'INVALID_WORSHIP_CATEGORY');
    }

    const lastItem = await prisma.worshipItem.findFirst({
      where: { categoryId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const item = await prisma.$transaction(async (tx) => {
      const createdItem = await tx.worshipItem.create({
        data: {
          categoryId,
          createdByUserId: userId,
          title,
          inputType: 'BOOLEAN',
          order: (lastItem?.order ?? 0) + 1,
          score: 0,
          xp: 0,
          isActive: true,
        },
        include: { category: true },
      });

      await tx.userCustomRequirement.create({
        data: {
          userId,
          worshipItemId: createdItem.id,
        },
      });

      return createdItem;
    });

    await AuditLogService.record({
      actorId: actor?.id,
      action: AUDIT_ACTIONS.WORSHIP_SCHEDULE_CUSTOMIZED,
      targetType: AUDIT_TARGET_TYPES.USER,
      targetId: userId,
      regionId: currentSchedule.user.region?.id ?? actor?.regionId ?? null,
      metadata: {
        createdCustomItemId: item.id,
        title,
        categoryId,
      },
    });

    return normalizeWorshipItem(item);
  }
}
