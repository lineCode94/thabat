import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { prisma } from '#lib/prisma.js';
import { AuthorizationService } from '#services/authorization.service.js';
import { StreakService } from '#services/streak.service.js';
import { ApiError } from '#utils/apiError.js';
import { addDays, toDateKey } from '#utils/week.js';

function can(permissionBag, permission) {
  return AuthorizationService.hasPermission(permissionBag, permission);
}

function percentage(part, total) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function sum(items, selector) {
  return items.reduce((total, item) => total + selector(item), 0);
}

function parseDateKey(dateKey) {
  if (!dateKey) return null;
  return new Date(`${dateKey}T00:00:00Z`);
}

function getMonthRange(monthKey) {
  const now = new Date();
  const [year, month] = String(monthKey ?? '').split('-').map(Number);
  const safeYear = Number.isInteger(year) ? year : now.getUTCFullYear();
  const safeMonthIndex = Number.isInteger(month) ? month - 1 : now.getUTCMonth();
  const start = new Date(Date.UTC(safeYear, safeMonthIndex, 1));
  const end = new Date(Date.UTC(safeYear, safeMonthIndex + 1, 0, 23, 59, 59, 999));

  return {
    start,
    end,
    monthKey: `${safeYear}-${String(safeMonthIndex + 1).padStart(2, '0')}`,
  };
}

function buildBreakdown(entries) {
  const byItem = new Map();

  entries.forEach((entry) => {
    const item = entry.worshipItem;
    if (!item) return;

    const current = byItem.get(item.id) ?? {
      worshipItemId: item.id,
      title: item.title,
      category: item.category?.name ?? null,
      total: 0,
      completed: 0,
      scoreEarned: 0,
      possibleScore: 0,
    };

    current.total += 1;
    current.possibleScore += item.score ?? 0;
    if (entry.isCompleted) {
      current.completed += 1;
      current.scoreEarned += item.score ?? 0;
    }

    byItem.set(item.id, current);
  });

  return Array.from(byItem.values()).map((item) => ({
    ...item,
    completionPercentage: percentage(item.completed, item.total),
  }));
}

async function getTargetUser(userId) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null, isActive: true },
    select: { id: true, fullName: true, email: true, regionId: true, timezone: true },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return user;
}

export class ReportSummaryService {
  static _permissionBag(actor, permissions) {
    return { ...actor, permissions };
  }

  static async assertCanViewReport(actor, permissions, targetUserId) {
    const permissionBag = this._permissionBag(actor, permissions);
    const targetUser = await getTargetUser(targetUserId);

    if (actor.id === targetUser.id && can(permissionBag, PERMISSIONS.REPORTS_VIEW_OWN)) {
      return targetUser;
    }

    if (can(permissionBag, PERMISSIONS.REPORTS_VIEW_ALL)) {
      return targetUser;
    }

    if (
      can(permissionBag, PERMISSIONS.REPORTS_VIEW_REGION) &&
      AuthorizationService.isSameRegion(actor, targetUser.regionId)
    ) {
      return targetUser;
    }

    if (
      can(permissionBag, PERMISSIONS.REPORTS_VIEW_ASSIGNED) &&
      await AuthorizationService.isAssignedUser(actor.id, targetUser.id)
    ) {
      return targetUser;
    }

    throw ApiError.forbidden('You are not allowed to view reports for this user');
  }

  static async getDailyReport(actor, permissions, query = {}) {
    const targetUserId = query.userId ?? actor.id;
    const targetUser = await this.assertCanViewReport(actor, permissions, targetUserId);
    const date = parseDateKey(query.date) ?? new Date();
    const nextDate = addDays(date, 1);

    const [trackingDay, xp, badges, achievements, missions, streak] = await Promise.all([
      prisma.trackingDay.findUnique({
        where: { userId_date: { userId: targetUser.id, date } },
        select: {
          id: true,
          date: true,
          status: true,
          notes: true,
          trackingEntries: {
            select: {
              id: true,
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
                  category: { select: { id: true, name: true } },
                },
              },
            },
            orderBy: { worshipItem: { order: 'asc' } },
          },
        },
      }),
      prisma.xPTransaction.aggregate({
        where: { userId: targetUser.id, createdAt: { gte: date, lt: nextDate } },
        _sum: { amount: true },
      }),
      prisma.userBadge.findMany({
        where: { userId: targetUser.id, earnedAt: { gte: date, lt: nextDate } },
        select: { earnedAt: true, badge: { select: { id: true, key: true, name: true, description: true, rarity: true } } },
        orderBy: { earnedAt: 'desc' },
      }),
      prisma.userAchievement.findMany({
        where: { userId: targetUser.id, earnedAt: { gte: date, lt: nextDate } },
        select: { earnedAt: true, achievement: { select: { id: true, name: true, description: true } } },
        orderBy: { earnedAt: 'desc' },
      }),
      prisma.userMission.findMany({
        where: {
          userId: targetUser.id,
          completionDate: { gte: date, lt: nextDate },
          completed: true,
        },
        select: { id: true, completionDate: true, mission: { select: { id: true, title: true, bonusXP: true } } },
        orderBy: { completionDate: 'desc' },
      }),
      StreakService.getStreakInfo(targetUser.id, targetUser.timezone),
    ]);

    const entries = trackingDay?.trackingEntries ?? [];
    const completedEntries = entries.filter((entry) => entry.isCompleted);
    const possibleScore = sum(entries, (entry) => entry.worshipItem?.score ?? 0);
    const completedScore = sum(completedEntries, (entry) => entry.worshipItem?.score ?? 0);

    return {
      type: 'DAILY',
      date: toDateKey(date),
      user: targetUser,
      trackingDay: trackingDay ? {
        id: trackingDay.id,
        status: trackingDay.status,
        notes: trackingDay.notes,
      } : null,
      totals: {
        xpEarned: xp._sum.amount ?? 0,
        consistencyPercentage: percentage(completedScore, possibleScore),
        worshipCompletionPercentage: percentage(completedEntries.length, entries.length),
        completedItems: completedEntries.length,
        totalAssignedItems: entries.length,
        completedScore,
        possibleScore,
      },
      worshipBreakdown: buildBreakdown(entries),
      streak: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        streakStatus: streak.streakStatus,
      },
      rewards: {
        badges: badges.map((record) => ({ ...record.badge, earnedAt: record.earnedAt })),
        achievements: achievements.map((record) => ({ ...record.achievement, earnedAt: record.earnedAt })),
        missions: missions.map((record) => ({ ...record.mission, userMissionId: record.id, completedAt: record.completionDate })),
      },
    };
  }

  static async getMonthlyReport(actor, permissions, query = {}) {
    const targetUserId = query.userId ?? actor.id;
    const targetUser = await this.assertCanViewReport(actor, permissions, targetUserId);
    const monthRange = getMonthRange(query.month);

    const [trackingDays, xp, badges, achievements, missions, streak] = await Promise.all([
      prisma.trackingDay.findMany({
        where: { userId: targetUser.id, date: { gte: monthRange.start, lte: monthRange.end } },
        select: {
          id: true,
          date: true,
          trackingEntries: {
            select: {
              isCompleted: true,
              scoreEarned: true,
              worshipItem: {
                select: {
                  id: true,
                  title: true,
                  score: true,
                  category: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.xPTransaction.aggregate({
        where: { userId: targetUser.id, createdAt: { gte: monthRange.start, lte: monthRange.end } },
        _sum: { amount: true },
      }),
      prisma.userBadge.findMany({
        where: { userId: targetUser.id, earnedAt: { gte: monthRange.start, lte: monthRange.end } },
        select: { earnedAt: true, badge: { select: { id: true, key: true, name: true, description: true, rarity: true } } },
        orderBy: { earnedAt: 'desc' },
      }),
      prisma.userAchievement.findMany({
        where: { userId: targetUser.id, earnedAt: { gte: monthRange.start, lte: monthRange.end } },
        select: { earnedAt: true, achievement: { select: { id: true, name: true, description: true } } },
        orderBy: { earnedAt: 'desc' },
      }),
      prisma.userMission.findMany({
        where: {
          userId: targetUser.id,
          completed: true,
          completionDate: { gte: monthRange.start, lte: monthRange.end },
        },
        select: { id: true, completionDate: true, mission: { select: { id: true, title: true, bonusXP: true } } },
        orderBy: { completionDate: 'desc' },
      }),
      StreakService.getStreakInfo(targetUser.id, targetUser.timezone),
    ]);

    const entries = trackingDays.flatMap((day) => day.trackingEntries);
    const completedEntries = entries.filter((entry) => entry.isCompleted);
    const possibleScore = sum(entries, (entry) => entry.worshipItem?.score ?? 0);
    const completedScore = sum(completedEntries, (entry) => entry.worshipItem?.score ?? 0);
    const dayCards = trackingDays.map((day) => {
      const dayEntries = day.trackingEntries;
      const dayPossibleScore = sum(dayEntries, (entry) => entry.worshipItem?.score ?? 0);
      const dayScore = sum(
        dayEntries.filter((entry) => entry.isCompleted),
        (entry) => entry.worshipItem?.score ?? 0,
      );

      return {
        date: toDateKey(day.date),
        completedItems: dayEntries.filter((entry) => entry.isCompleted).length,
        totalItems: dayEntries.length,
        score: dayScore,
        possibleScore: dayPossibleScore,
        consistencyPercentage: percentage(dayScore, dayPossibleScore),
      };
    });

    const bestDay = [...dayCards].sort((a, b) => b.consistencyPercentage - a.consistencyPercentage)[0] ?? null;
    const weakestDay = [...dayCards].sort((a, b) => a.consistencyPercentage - b.consistencyPercentage)[0] ?? null;

    return {
      type: 'MONTHLY',
      month: monthRange.monthKey,
      user: targetUser,
      totals: {
        xpEarned: xp._sum.amount ?? 0,
        consistencyPercentage: percentage(completedScore, possibleScore),
        worshipCompletionPercentage: percentage(completedEntries.length, entries.length),
        completedItems: completedEntries.length,
        totalAssignedItems: entries.length,
        completedScore,
        possibleScore,
        activeTrackingDays: trackingDays.length,
        completedMissions: missions.length,
        earnedBadges: badges.length,
        earnedAchievements: achievements.length,
      },
      dayCards,
      bestDay,
      weakestDay,
      worshipBreakdown: buildBreakdown(entries),
      streak: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        streakStatus: streak.streakStatus,
      },
      rewards: {
        badges: badges.map((record) => ({ ...record.badge, earnedAt: record.earnedAt })),
        achievements: achievements.map((record) => ({ ...record.achievement, earnedAt: record.earnedAt })),
        missions: missions.map((record) => ({ ...record.mission, userMissionId: record.id, completedAt: record.completionDate })),
      },
    };
  }
}
