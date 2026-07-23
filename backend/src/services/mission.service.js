import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '#constants/auditLog.js';
import { PAGINATION } from '#constants/index.js';
import { prisma } from '#lib/prisma.js';
import { AchievementEngine } from '#services/achievement.engine.js';
import { AuditLogService, buildChangedFieldsDiff } from '#services/audit-log.service.js';
import { GamificationNotificationService } from '#services/gamification-notification.service.js';
import { NotificationService } from '#services/notification.service.js';
import { XpService } from '#services/xp.service.js';
import { ApiError } from '#utils/apiError.js';
import { getThabatWeekRange } from '#utils/week.js';

const missionSelect = {
  id: true,
  title: true,
  description: true,
  bonusXP: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

function parseBooleanFilter(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export class MissionService {
  static async getSummary(userId, timezone = 'Africa/Cairo') {
    const now = new Date();
    const weekRange = getThabatWeekRange(timezone, now);
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    const baseWhere = {
      userId,
      mission: { deletedAt: null, isActive: true },
    };

    const [assigned, pending, completed, completedThisWeek, completedThisMonth, recent, missionXp] = await Promise.all([
      prisma.userMission.count({ where: baseWhere }),
      prisma.userMission.count({ where: { ...baseWhere, completed: false } }),
      prisma.userMission.count({ where: { ...baseWhere, completed: true } }),
      prisma.userMission.count({
        where: {
          ...baseWhere,
          completed: true,
          completionDate: { gte: weekRange.weekStartDate, lte: weekRange.weekEndDateTime },
        },
      }),
      prisma.userMission.count({
        where: {
          ...baseWhere,
          completed: true,
          completionDate: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.userMission.findMany({
        where: baseWhere,
        include: { mission: { select: missionSelect } },
        orderBy: [{ completed: 'asc' }, { completionDate: 'desc' }, { createdAt: 'desc' }],
        take: 3,
      }),
      prisma.xPTransaction.aggregate({
        where: {
          userId,
          sourceType: 'USER_MISSION',
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      assigned,
      pending,
      completed,
      completedThisWeek,
      completedThisMonth,
      missionXpThisMonth: missionXp._sum.amount ?? 0,
      week: {
        start: weekRange.weekStartKey,
        end: weekRange.weekEndKey,
      },
      recent,
    };
  }

  static async findAssignableUsers({ search = '', limit = 8, scope = {} } = {}) {
    const roleWhere = { code: 'USER' };
    const baseWhere = {
      deletedAt: null,
      isActive: true,
      role: roleWhere,
      ...(search
        ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
        : {}),
      ...(scope.regionId ? { regionId: scope.regionId } : {}),
      ...(scope.assignedToMentorId
        ? {
          mentorAssignmentsAsStudent: {
            some: {
              mentorId: scope.assignedToMentorId,
              isActive: true,
            },
          },
        }
        : {}),
    };

    return prisma.user.findMany({
      where: baseWhere,
      select: {
        id: true,
        fullName: true,
        email: true,
        regionId: true,
        region: { select: { id: true, name: true } },
      },
      orderBy: { fullName: 'asc' },
      take: Math.min(limit, 20),
    });
  }

  static async findAssignableUser(userId) {
    return prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        regionId: true,
      },
    });
  }

  static async findMany({ viewerUserId, includeCatalog = false, filters = {}, pagination = {} } = {}) {
    const page = pagination.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(pagination.limit ?? PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    if (!includeCatalog) {
      const where = {
        userId: viewerUserId,
        mission: {
          deletedAt: null,
          ...(parseBooleanFilter(filters.isActive) === undefined
            ? { isActive: true }
            : { isActive: parseBooleanFilter(filters.isActive) }),
          ...(filters.search
            ? { title: { contains: filters.search, mode: 'insensitive' } }
            : {}),
        },
      };

      const [total, userMissions] = await Promise.all([
        prisma.userMission.count({ where }),
        prisma.userMission.findMany({
          where,
          include: { mission: { select: missionSelect } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      return {
        missions: userMissions,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }

    const where = {
      deletedAt: null,
      ...(parseBooleanFilter(filters.isActive) === undefined
        ? {}
        : { isActive: parseBooleanFilter(filters.isActive) }),
      ...(filters.search ? { title: { contains: filters.search, mode: 'insensitive' } } : {}),
    };

    const [total, missions] = await Promise.all([
      prisma.mission.count({ where }),
      prisma.mission.findMany({
        where,
        select: {
          ...missionSelect,
          _count: { select: { userMissions: true } },
        },
        orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      missions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async findById(id) {
    const mission = await prisma.mission.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...missionSelect,
        _count: { select: { userMissions: true } },
      },
    });

    if (!mission) {
      throw ApiError.notFound('Mission not found');
    }

    return mission;
  }

  static async create(data, { actorId = null } = {}) {
    const mission = await prisma.mission.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        bonusXP: data.bonusXP ?? 0,
        isActive: data.isActive ?? true,
      },
      select: missionSelect,
    });

    await AuditLogService.record({
      actorId,
      action: AUDIT_ACTIONS.MISSION_CREATED,
      targetType: AUDIT_TARGET_TYPES.MISSION,
      targetId: mission.id,
      metadata: { title: mission.title, bonusXP: mission.bonusXP },
    });

    return mission;
  }

  static async update(id, data, { actorId = null } = {}) {
    const before = await this.findById(id);
    const mission = await prisma.mission.update({
      where: { id },
      data,
      select: missionSelect,
    });
    const diff = buildChangedFieldsDiff(before, mission, ['title', 'description', 'bonusXP', 'isActive']);

    await AuditLogService.record({
      actorId,
      action: AUDIT_ACTIONS.MISSION_UPDATED,
      targetType: AUDIT_TARGET_TYPES.MISSION,
      targetId: mission.id,
      metadata: { changes: diff },
    });

    return mission;
  }

  static async softDelete(id, { actorId = null } = {}) {
    const before = await this.findById(id);

    if (before.deletedAt) {
      throw ApiError.notFound('Mission not found');
    }

    const mission = await prisma.mission.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
      select: missionSelect,
    });

    await AuditLogService.record({
      actorId,
      action: AUDIT_ACTIONS.MISSION_DEACTIVATED,
      targetType: AUDIT_TARGET_TYPES.MISSION,
      targetId: mission.id,
      metadata: { title: mission.title },
    });

    return mission;
  }

  static async assign(id, userId, { actorId = null } = {}) {
    const [mission, user] = await Promise.all([
      prisma.mission.findFirst({ where: { id, deletedAt: null, isActive: true }, select: missionSelect }),
      this.findAssignableUser(userId),
    ]);

    if (!mission) {
      throw ApiError.notFound('Mission not found');
    }

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const existing = await prisma.userMission.findUnique({
      where: { userId_missionId: { userId, missionId: id } },
      include: { mission: { select: missionSelect }, user: { select: { id: true, fullName: true, regionId: true } } },
    });

    if (existing) {
      return existing;
    }

    const userMission = await prisma.userMission.create({
      data: { userId, missionId: id },
      include: { mission: { select: missionSelect }, user: { select: { id: true, fullName: true, regionId: true } } },
    });

    await Promise.all([
      NotificationService.createNotification({
        userId,
        title: 'New mission assigned',
        message: `You have a new mission: ${mission.title}`,
        type: 'MISSION_ASSIGNED',
        priority: 'MEDIUM',
        metadata: { missionId: mission.id, userMissionId: userMission.id, route: '/missions' },
      }),
      AuditLogService.record({
        actorId,
        action: AUDIT_ACTIONS.MISSION_ASSIGNED,
        targetType: AUDIT_TARGET_TYPES.USER_MISSION,
        targetId: userMission.id,
        regionId: user.regionId,
        metadata: { userId, missionId: id },
      }),
    ]);

    return userMission;
  }

  static async complete(id, userId) {
    const userMission = await prisma.userMission.findUnique({
      where: { userId_missionId: { userId, missionId: id } },
      include: {
        mission: { select: missionSelect },
        user: { select: { id: true, regionId: true } },
      },
    });

    if (!userMission || userMission.mission.deletedAt || !userMission.mission.isActive) {
      throw ApiError.notFound('Assigned mission not found');
    }

    if (userMission.completed) {
      return { userMission, xpAwarded: 0 };
    }

    const completedMission = await prisma.userMission.update({
      where: { id: userMission.id },
      data: {
        completed: true,
        progress: 100,
        completionDate: new Date(),
      },
      include: {
        mission: { select: missionSelect },
        user: { select: { id: true, regionId: true } },
      },
    });

    const xpAwarded = await XpService.awardMissionBonus(userId, completedMission);
    const newlyUnlockedAchievements = await AchievementEngine.evaluateMission(userId);

    await Promise.all([
      NotificationService.createNotification({
        userId,
        title: 'Mission completed',
        message: `Mission completed: ${completedMission.mission.title}`,
        type: 'MISSION_COMPLETED',
        priority: 'MEDIUM',
        metadata: { missionId: id, userMissionId: completedMission.id, xpAwarded, route: '/missions' },
      }),
      GamificationNotificationService.notifyAchievementsUnlocked(userId, newlyUnlockedAchievements),
      AuditLogService.record({
        actorId: userId,
        action: AUDIT_ACTIONS.MISSION_COMPLETED,
        targetType: AUDIT_TARGET_TYPES.USER_MISSION,
        targetId: completedMission.id,
        regionId: completedMission.user.regionId,
        metadata: { missionId: id, xpAwarded },
      }),
    ]);

    return { userMission: completedMission, xpAwarded, newlyUnlockedAchievements };
  }
}
