import {
  MENTOR_ASSIGNMENT_STATUS,
  ONBOARDING_STATUS,
  PENDING_SETUP_REGION_NAME,
  TODAY_WORSHIP_READINESS,
} from '#constants/onboarding.js';
import { ROLES } from '#constants/permissionRegistry.js';
import { prisma } from '#lib/prisma.js';
import { ApiError } from '#utils/apiError.js';
import { getThabatDateForTimezone } from '#utils/week.js';

function isPendingSetupRegion(region) {
  return region?.name === PENDING_SETUP_REGION_NAME;
}

function getDayOfWeekForTimezone(timezone, date = new Date()) {
  return getThabatDateForTimezone(timezone || 'UTC', date).getUTCDay();
}

function isItemAvailableToday(item, dayOfWeek) {
  return !item.daysOfWeek?.length || item.daysOfWeek.includes(dayOfWeek);
}

export class OnboardingService {
  static async getLowestActiveWorshipLevel(client = prisma) {
    return client.worshipLevel.findFirst({
      where: { isActive: true, deletedAt: null },
      orderBy: { order: 'asc' },
    });
  }

  static async ensurePendingSetupRegion(client = prisma) {
    return client.region.upsert({
      where: { name: PENDING_SETUP_REGION_NAME },
      update: {
        isActive: true,
        deletedAt: null,
        description: 'System region for self-registered users awaiting authorized setup.',
      },
      create: {
        name: PENDING_SETUP_REGION_NAME,
        description: 'System region for self-registered users awaiting authorized setup.',
        isActive: true,
      },
    });
  }

  static async createNormalUserOnboarding({ userId }, client = prisma) {
    const defaultLevel = await this.getLowestActiveWorshipLevel(client);
    if (!defaultLevel) {
      throw ApiError.conflict(
        'Registration is temporarily unavailable because no active Worship Level is configured.',
        'NO_ACTIVE_WORSHIP_LEVEL',
      );
    }

    await client.userLevel.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    const userLevel = await client.userLevel.create({
      data: {
        userId,
        levelId: defaultLevel.id,
        isActive: true,
      },
      include: {
        worshipLevel: true,
      },
    });

    return userLevel;
  }

  static async getActiveUserLevel(userId, client = prisma) {
    return client.userLevel.findFirst({
      where: {
        userId,
        isActive: true,
        worshipLevel: {
          isActive: true,
          deletedAt: null,
        },
      },
      include: {
        worshipLevel: true,
      },
      orderBy: [
        { assignedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  static async getMentorAssignmentStatus(userId, client = prisma) {
    const assignment = await client.mentorAssignment.findFirst({
      where: { userId, isActive: true },
      select: { id: true },
    });

    return assignment ? MENTOR_ASSIGNMENT_STATUS.ASSIGNED : MENTOR_ASSIGNMENT_STATUS.PENDING;
  }

  static async getUserSessionContext(userId, client = prisma) {
    const user = await client.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        region: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const activeUserLevel = await this.getActiveUserLevel(userId, client);
    const mentorAssignmentStatus = user.role?.code === ROLES.USER
      ? await this.getMentorAssignmentStatus(userId, client)
      : null;

    return this.toSessionUser(user, activeUserLevel, mentorAssignmentStatus);
  }

  static toSessionUser(user, activeUserLevel = null, mentorAssignmentStatus = null) {
    const sessionUser = { ...user };
    delete sessionUser.passwordHash;
    delete sessionUser.userLevels;
    delete sessionUser.mentorAssignmentsAsStudent;

    sessionUser.worshipLevel = activeUserLevel?.worshipLevel
      ? {
          id: activeUserLevel.worshipLevel.id,
          name: activeUserLevel.worshipLevel.name,
          order: activeUserLevel.worshipLevel.order,
        }
      : null;

    sessionUser.mentorAssignmentStatus = mentorAssignmentStatus;

    return sessionUser;
  }

  static async resolveTodayWorshipReadiness(userId, client = prisma, date = new Date()) {
    const user = await client.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        region: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const activeUserLevel = await this.getActiveUserLevel(userId, client);

    if (user.role?.code === ROLES.USER && user.onboardingStatus !== ONBOARDING_STATUS.ACTIVE) {
      return {
        ready: false,
        reason: TODAY_WORSHIP_READINESS.ONBOARDING_INCOMPLETE,
        worshipLevel: activeUserLevel?.worshipLevel ?? null,
        items: [],
      };
    }

    if (!activeUserLevel) {
      return {
        ready: false,
        reason: TODAY_WORSHIP_READINESS.NO_ACTIVE_WORSHIP_LEVEL,
        worshipLevel: null,
        items: [],
      };
    }

    const [requirements, customRequirements, excludedRequirements] = await Promise.all([
      client.levelRequirement.findMany({
        where: { levelId: activeUserLevel.levelId },
        include: {
          worshipItem: {
            include: { category: true },
          },
        },
        orderBy: {
          worshipItem: { order: 'asc' },
        },
      }),
      client.userCustomRequirement.findMany({
        where: { userId },
        include: {
          worshipItem: {
            include: { category: true },
          },
        },
        orderBy: {
          worshipItem: { order: 'asc' },
        },
      }),
      client.userExcludedRequirement.findMany({
        where: { userId },
        select: { worshipItemId: true },
      }),
    ]);

    if (requirements.length === 0 && customRequirements.length === 0) {
      return {
        ready: false,
        reason: TODAY_WORSHIP_READINESS.NO_LEVEL_REQUIREMENTS,
        worshipLevel: activeUserLevel.worshipLevel,
        items: [],
      };
    }

    const excludedItemIds = new Set(excludedRequirements.map((requirement) => requirement.worshipItemId));
    const itemsById = new Map();

    requirements.forEach((requirement) => {
      const item = requirement.worshipItem;
      if (item && !excludedItemIds.has(item.id)) {
        itemsById.set(item.id, item);
      }
    });

    customRequirements.forEach((requirement) => {
      const item = requirement.worshipItem;
      if (item) {
        itemsById.set(item.id, item);
      }
    });

    const dayOfWeek = getDayOfWeekForTimezone(user.timezone, date);
    const configuredItems = [...itemsById.values()]
      .filter((item) => (
        item?.isActive
        && !item.deletedAt
        && item.category?.isActive
        && !item.category?.deletedAt
        && isItemAvailableToday(item, dayOfWeek)
      ))
      .sort((first, second) => {
        const categoryOrder = (first.category?.order ?? 0) - (second.category?.order ?? 0);
        if (categoryOrder !== 0) return categoryOrder;
        return (first.order ?? 0) - (second.order ?? 0);
      });

    if (configuredItems.length === 0) {
      return {
        ready: false,
        reason: TODAY_WORSHIP_READINESS.NO_WORSHIP_ITEMS_CONFIGURED,
        worshipLevel: activeUserLevel.worshipLevel,
        items: [],
      };
    }

    return {
      ready: true,
      reason: TODAY_WORSHIP_READINESS.READY,
      worshipLevel: activeUserLevel.worshipLevel,
      items: configuredItems,
      isPendingSetupRegion: isPendingSetupRegion(user.region),
    };
  }
}
