import { AchievementEngine } from './achievement.engine.js';
import { BadgeEngine } from './badge.engine.js';
import { GamificationNotificationService } from './gamification-notification.service.js';
import { OnboardingService } from './onboarding.service.js';
import { StreakService } from './streak.service.js';
import { XpService } from './xp.service.js';

import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '#constants/auditLog.js';
import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { prisma } from '#lib/prisma.js';
import { AuditLogService } from '#services/audit-log.service.js';
import { AuthorizationService } from '#services/authorization.service.js';
import { ApiError } from '#utils/apiError.js';
import { addDays, getThabatDateForTimezone, getThabatWeekRange, toDateKey } from '#utils/week.js';

const TRACKING_DAY_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  REOPENED: 'REOPENED',
};

const TRACKING_ENTRY_SELECT = {
  id: true,
  worshipItemId: true,
  isCompleted: true,
  count: true,
  duration: true,
  notes: true,
  scoreEarned: true,
  worshipItem: {
    select: {
      id: true,
      title: true,
      score: true,
      xp: true,
      inputType: true,
      targetValue: true,
      category: { select: { id: true, name: true } },
    },
  },
};

function can(permissionBag, permission) {
  return AuthorizationService.hasPermission(permissionBag, permission);
}

function resolveTrackingCompletion(entry, worshipItem) {
  const inputType = worshipItem?.inputType?.toUpperCase();

  if (inputType === 'COUNT') {
    const count = Number(entry.count ?? 0);
    if (worshipItem?.targetValue) {
      return count >= worshipItem.targetValue;
    }

    return count > 0;
  }

  if (inputType === 'DURATION') {
    const duration = Number(entry.duration ?? 0);
    if (worshipItem?.targetValue) {
      return duration >= worshipItem.targetValue;
    }

    return duration > 0;
  }

  return Boolean(entry.isCompleted);
}

export class TrackingService {
  static _getTodayForTimezone(timezone) {
    return getThabatDateForTimezone(timezone);
  }

  static _parseDateKey(dateKey) {
    if (!dateKey) return null;
    return new Date(`${dateKey}T00:00:00Z`);
  }

  static _permissionBag(actor, permissions) {
    return { ...actor, permissions };
  }

  static _isWeekClosed(timezone, date, now = new Date()) {
    const weekRange = getThabatWeekRange(timezone, date, { applyDayBoundary: false });
    return weekRange.weekEndDateTime.getTime() < now.getTime();
  }

  static async _assertTrackingDateWritable(userId, timezone, date) {
    if (!this._isWeekClosed(timezone, date)) {
      const trackingDay = await prisma.trackingDay.findUnique({
        where: { userId_date: { userId, date } },
        select: { id: true, status: true },
      });

      if (trackingDay?.status === TRACKING_DAY_STATUS.CLOSED) {
        await prisma.trackingDay.update({
          where: { id: trackingDay.id },
          data: { status: TRACKING_DAY_STATUS.OPEN },
        });
      }

      return;
    }

    const trackingDay = await prisma.trackingDay.findUnique({
      where: { userId_date: { userId, date } },
      select: { id: true, status: true },
    });

    if (trackingDay?.status === TRACKING_DAY_STATUS.REOPENED) {
      return;
    }

    if (trackingDay && trackingDay.status !== TRACKING_DAY_STATUS.CLOSED) {
      await prisma.trackingDay.update({
        where: { id: trackingDay.id },
        data: { status: TRACKING_DAY_STATUS.CLOSED },
      });
    }

    throw ApiError.badRequest('This week is closed for tracking', 'WEEK_CLOSED');
  }

  static async _getTargetUser(userId) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null, isActive: true },
      select: { id: true, fullName: true, email: true, regionId: true, timezone: true },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  static async _assertCanViewUserTracking(actor, permissions, targetUserId) {
    const permissionBag = this._permissionBag(actor, permissions);
    const targetUser = await this._getTargetUser(targetUserId);

    if (
      actor.id === targetUser.id &&
      can(permissionBag, PERMISSIONS.TRACKING_MANAGE_SELF)
    ) {
      return targetUser;
    }

    if (can(permissionBag, PERMISSIONS.TRACKING_MANAGE_ALL)) {
      return targetUser;
    }

    if (
      can(permissionBag, PERMISSIONS.TRACKING_MANAGE_REGION) &&
      AuthorizationService.isSameRegion(actor, targetUser.regionId)
    ) {
      return targetUser;
    }

    if (
      can(permissionBag, PERMISSIONS.TRACKING_REVIEW_ASSIGNED) &&
      await AuthorizationService.isAssignedUser(actor.id, targetUser.id)
    ) {
      return targetUser;
    }

    throw ApiError.forbidden('You are not allowed to view tracking history for this user');
  }

  static async calculateSummary(trackingDayId, totalAssignedItems = null, assignedItemIds = null) {
    const worshipItemsCount = totalAssignedItems ?? await prisma.worshipItem.count({
      where: { isActive: true, deletedAt: null },
    });

    if (!trackingDayId) {
      return { completedItems: 0, totalItems: worshipItemsCount, progressPercentage: 0 };
    }

    const completedItems = await prisma.trackingEntry.count({
      where: {
        trackingDayId,
        isCompleted: true,
        ...(assignedItemIds ? { worshipItemId: { in: assignedItemIds } } : {}),
      },
    });

    const progressPercentage = worshipItemsCount > 0 ? Math.round((completedItems / worshipItemsCount) * 100) : 0;
    
    return {
      completedItems,
      totalItems: worshipItemsCount,
      progressPercentage,
    };
  }

  static async getTodayTracking(userId, timezone) {
    const today = this._getTodayForTimezone(timezone);
    const readiness = await OnboardingService.resolveTodayWorshipReadiness(userId);

    if (!readiness.ready) {
      return {
        ready: false,
        reason: readiness.reason,
        worshipLevel: readiness.worshipLevel,
        items: [],
        trackingDay: null,
        summary: {
          completedItems: 0,
          totalItems: 0,
          progressPercentage: 0,
        },
      };
    }

    const assignedItems = readiness.items;
    const assignedItemIds = assignedItems.map((item) => item.id);

    let trackingDay = await prisma.trackingDay.findUnique({
      where: {
        userId_date: { userId, date: today },
      },
      include: {
        trackingEntries: {
          include: { worshipItem: true }
        },
      },
    });

    trackingDay = await prisma.$transaction(async (tx) => {
      const day = trackingDay ?? await tx.trackingDay.create({
        data: { userId, date: today, status: 'OPEN' },
      });

      const existingEntries = await tx.trackingEntry.findMany({
        where: {
          trackingDayId: day.id,
          worshipItemId: { in: assignedItemIds },
        },
        select: { worshipItemId: true },
      });
      const existingItemIds = new Set(existingEntries.map((entry) => entry.worshipItemId));
      const missingItemIds = assignedItemIds.filter((itemId) => !existingItemIds.has(itemId));

      if (missingItemIds.length > 0) {
        await tx.trackingEntry.createMany({
          data: missingItemIds.map((worshipItemId) => ({
            trackingDayId: day.id,
            worshipItemId,
            isCompleted: false,
          })),
          skipDuplicates: true,
        });
      }

      return tx.trackingDay.findUnique({
        where: { id: day.id },
        include: {
          trackingEntries: {
            where: { worshipItemId: { in: assignedItemIds } },
            include: { worshipItem: { include: { category: true } } },
            orderBy: { worshipItem: { order: 'asc' } },
          },
        },
      });
    });

    const summary = await this.calculateSummary(trackingDay.id, assignedItems.length, assignedItemIds);

    return {
      ready: true,
      reason: readiness.reason,
      worshipLevel: readiness.worshipLevel,
      items: assignedItems,
      trackingDay,
      summary,
    };
  }

  static async submitTodayTracking(userId, timezone, entries) {
    const today = this._getTodayForTimezone(timezone);
    return this.submitTrackingForDate(userId, timezone, today, entries);
  }

  static async submitTrackingForDate(userId, timezone, date, entries) {
    await this._assertTrackingDateWritable(userId, timezone, date);

    const readiness = await OnboardingService.resolveTodayWorshipReadiness(userId);

    if (!readiness.ready) {
      throw ApiError.badRequest('Today worship is not ready for tracking', readiness.reason);
    }

    const assignedItemsById = new Map(readiness.items.map((item) => [item.id, item]));
    const assignedItemIds = new Set(assignedItemsById.keys());
    const hasUnassignedEntry = entries.some((entry) => !assignedItemIds.has(entry.worshipItemId));
    if (hasUnassignedEntry) {
      throw ApiError.forbidden('One or more submitted worship items are not assigned to the current user');
    }

    let trackingDay = await prisma.trackingDay.findUnique({
      where: {
        userId_date: { userId, date },
      },
    });

    if (!trackingDay) {
      trackingDay = await prisma.trackingDay.create({
        data: { userId, date, status: TRACKING_DAY_STATUS.OPEN },
      });
    } else if (
      trackingDay.status === TRACKING_DAY_STATUS.CLOSED &&
      this._isWeekClosed(timezone, date)
    ) {
      throw ApiError.badRequest('This week is closed for tracking', 'WEEK_CLOSED');
    } else if (trackingDay.status === TRACKING_DAY_STATUS.CLOSED) {
      trackingDay = await prisma.trackingDay.update({
        where: { id: trackingDay.id },
        data: { status: TRACKING_DAY_STATUS.OPEN },
      });
    }

    const newlyUnlocked = [];

    // Upsert each entry
    for (const entry of entries) {
      const worshipItem = assignedItemsById.get(entry.worshipItemId);
      const isCompleted = resolveTrackingCompletion(entry, worshipItem);
      const scoreEarned = isCompleted ? (worshipItem?.score ?? 0) : 0;
      const trackingEntry = await prisma.trackingEntry.upsert({
        where: {
          trackingDayId_worshipItemId: {
            trackingDayId: trackingDay.id,
            worshipItemId: entry.worshipItemId,
          },
        },
        create: {
          trackingDayId: trackingDay.id,
          worshipItemId: entry.worshipItemId,
          isCompleted,
          count: entry.count,
          duration: entry.duration,
          notes: entry.notes,
          scoreEarned,
        },
        update: {
          isCompleted,
          count: entry.count,
          duration: entry.duration,
          notes: entry.notes,
          scoreEarned,
        },
      });

      // Award XP if completed
      if (trackingEntry.isCompleted) {
        const unlockedXpAch = await XpService.awardWorshipXp(userId, trackingEntry);
        if (unlockedXpAch && unlockedXpAch.length > 0) {
          newlyUnlocked.push(...unlockedXpAch);
        }
      }
    }

    const updatedDay = await prisma.trackingDay.findUnique({
      where: { id: trackingDay.id },
      include: { trackingEntries: { include: { worshipItem: true } } },
    });

    const summary = await this.calculateSummary(
      trackingDay.id,
      readiness.items.length,
      Array.from(assignedItemIds),
    );

    // Evaluate achievements
    const newlyUnlockedTracking = await AchievementEngine.evaluateTracking(userId, timezone);
    const newlyUnlockedStreak = await AchievementEngine.evaluateStreak(userId, timezone);

    // Evaluate badges triggered by tracking
    const newlyEarnedBadgesTracking = await BadgeEngine.evaluateTracking(userId);

    // Evaluate streak badges
    const streakInfo = await StreakService.getStreakInfo(userId, timezone);
    const newlyEarnedBadgesStreak = await BadgeEngine.evaluateStreak(userId, streakInfo);

    const allUnlocked = [
      ...newlyUnlocked,
      ...newlyUnlockedTracking,
      ...newlyUnlockedStreak,
    ];
    const allBadges = [
      ...newlyEarnedBadgesTracking,
      ...newlyEarnedBadgesStreak,
    ];
    const uniqueUnlocked = Array.from(new Map(allUnlocked.map(a => [a.key, a])).values());
    const uniqueBadges = Array.from(new Map(allBadges.map(b => [b.key, b])).values());

    await Promise.all([
      GamificationNotificationService.notifyAchievementsUnlocked(userId, uniqueUnlocked),
      GamificationNotificationService.notifyBadgesEarned(userId, uniqueBadges),
    ]);

    return { 
      trackingDay: updatedDay, 
      ready: true,
      reason: readiness.reason,
      worshipLevel: readiness.worshipLevel,
      items: readiness.items,
      summary, 
      newlyUnlockedAchievements: uniqueUnlocked,
      newlyEarnedBadges: uniqueBadges,
    };
  }

  static async getHistory(actor, permissions, query = {}) {
    const targetUserId = query.userId ?? actor.id;
    const targetUser = await this._assertCanViewUserTracking(actor, permissions, targetUserId);
    const weekAnchorDate = this._parseDateKey(query.weekStartDate) ?? new Date();
    const weekRange = getThabatWeekRange(targetUser.timezone, weekAnchorDate, {
      applyDayBoundary: !query.weekStartDate,
    });
    const isPastWeek = weekRange.weekEndDateTime.getTime() < Date.now();

    const trackingDays = await prisma.trackingDay.findMany({
      where: {
        userId: targetUser.id,
        date: {
          gte: weekRange.weekStartDate,
          lte: weekRange.weekEndDate,
        },
      },
      select: {
        id: true,
        date: true,
        status: true,
        notes: true,
        trackingEntries: {
          select: TRACKING_ENTRY_SELECT,
          orderBy: { worshipItem: { order: 'asc' } },
        },
      },
      orderBy: { date: 'asc' },
    });

    const daysByKey = new Map(trackingDays.map((day) => [toDateKey(day.date), day]));
    const hasReopenedDay = trackingDays.some((day) => day.status === TRACKING_DAY_STATUS.REOPENED);
    const weekStatus = hasReopenedDay
      ? TRACKING_DAY_STATUS.REOPENED
      : (isPastWeek ? TRACKING_DAY_STATUS.CLOSED : TRACKING_DAY_STATUS.OPEN);
    const isClosed = weekStatus === TRACKING_DAY_STATUS.CLOSED;
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekRange.weekStartDate, index);
      const dateKey = toDateKey(date);
      const day = daysByKey.get(dateKey);
      const status = day?.status ?? (isPastWeek ? TRACKING_DAY_STATUS.CLOSED : TRACKING_DAY_STATUS.OPEN);

      return {
        date: dateKey,
        trackingDayId: day?.id ?? null,
        status,
        isClosed: status === TRACKING_DAY_STATUS.CLOSED,
        notes: day?.notes ?? null,
        entries: day?.trackingEntries ?? [],
      };
    });

    return {
      user: targetUser,
      week: {
        weekStartDate: weekRange.weekStartKey,
        weekEndDate: weekRange.weekEndKey,
        closesAt: weekRange.weekEndDateTime.toISOString(),
        status: weekStatus,
        isClosed,
        statusValues: Object.values(TRACKING_DAY_STATUS),
      },
      days,
    };
  }

  static async reopenWeek(userId, weekStartDateKey, { actorId = null } = {}) {
    const targetUser = await this._getTargetUser(userId);
    const weekRange = getThabatWeekRange(
      targetUser.timezone,
      this._parseDateKey(weekStartDateKey),
      { applyDayBoundary: false },
    );

    const result = await prisma.$transaction(async (tx) => {
      const existingDays = await tx.trackingDay.findMany({
        where: {
          userId,
          date: {
            gte: weekRange.weekStartDate,
            lte: weekRange.weekEndDate,
          },
        },
        select: { date: true },
      });

      const existingDateKeys = new Set(existingDays.map((day) => toDateKey(day.date)));
      const missingDates = Array.from({ length: 7 }, (_, index) => addDays(weekRange.weekStartDate, index))
        .filter((date) => !existingDateKeys.has(toDateKey(date)));

      if (missingDates.length > 0) {
        await tx.trackingDay.createMany({
          data: missingDates.map((date) => ({
            userId,
            date,
            status: TRACKING_DAY_STATUS.REOPENED,
          })),
          skipDuplicates: true,
        });
      }

      return tx.trackingDay.updateMany({
        where: {
          userId,
          date: {
            gte: weekRange.weekStartDate,
            lte: weekRange.weekEndDate,
          },
        },
        data: {
          status: TRACKING_DAY_STATUS.REOPENED,
        },
      });
    });

    await AuditLogService.record({
      actorId,
      action: AUDIT_ACTIONS.WEEK_REOPENED,
      targetType: AUDIT_TARGET_TYPES.TRACKING_WEEK,
      targetId: `${userId}:${weekRange.weekStartKey}`,
      regionId: targetUser.regionId,
      metadata: {
        userId,
        weekStartDate: weekRange.weekStartKey,
        weekEndDate: weekRange.weekEndKey,
        reopenedDays: result.count,
      },
    });

    return {
      user: targetUser,
      week: {
        weekStartDate: weekRange.weekStartKey,
        weekEndDate: weekRange.weekEndKey,
        closesAt: weekRange.weekEndDateTime.toISOString(),
        status: result.count > 0 ? TRACKING_DAY_STATUS.REOPENED : TRACKING_DAY_STATUS.CLOSED,
        isClosed: result.count === 0 && weekRange.weekEndDateTime.getTime() < Date.now(),
        statusValues: Object.values(TRACKING_DAY_STATUS),
      },
      reopenedDays: result.count,
    };
  }
}
