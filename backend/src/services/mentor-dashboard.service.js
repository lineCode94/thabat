import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { prisma } from '#lib/prisma.js';
import { AuthorizationService } from '#services/authorization.service.js';
import { getThabatDateForTimezone, getThabatWeekRange, toDateKey } from '#utils/week.js';

function can(permissionBag, permission) {
  return AuthorizationService.hasPermission(permissionBag, permission);
}

function percentage(part, total) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function sum(items, selector) {
  return items.reduce((total, item) => total + selector(item), 0);
}

export class MentorDashboardService {
  static _permissionBag(actor, permissions) {
    return { ...actor, permissions };
  }

  static _buildUserWhere(actor, permissions) {
    const permissionBag = this._permissionBag(actor, permissions);
    const base = {
      deletedAt: null,
      isActive: true,
      role: { code: 'USER' },
    };

    if (can(permissionBag, PERMISSIONS.REVIEWS_MANAGE_ALL) || can(permissionBag, PERMISSIONS.USERS_MANAGE_ALL)) {
      return base;
    }

    if (can(permissionBag, PERMISSIONS.REVIEWS_MANAGE_REGION) || can(permissionBag, PERMISSIONS.USERS_MANAGE_REGION)) {
      return { ...base, regionId: actor.regionId };
    }

    return {
      ...base,
      mentorAssignmentsAsStudent: {
        some: {
          mentorId: actor.id,
          isActive: true,
        },
      },
    };
  }

  static async getDashboard(actor, permissions) {
    const userWhere = this._buildUserWhere(actor, permissions);
    const today = getThabatDateForTimezone(actor.timezone ?? 'Africa/Cairo');
    const weekRange = getThabatWeekRange(actor.timezone ?? 'Africa/Cairo', today);

    const [users, pendingReviews] = await Promise.all([
      prisma.user.findMany({
        where: userWhere,
        select: {
          id: true,
          fullName: true,
          email: true,
          regionId: true,
          region: { select: { id: true, name: true } },
          userLevels: {
            where: { isActive: true },
            select: { worshipLevel: { select: { id: true, name: true, order: true } } },
            take: 1,
          },
          mentorAssignmentsAsStudent: {
            where: { isActive: true },
            select: { mentor: { select: { id: true, fullName: true } } },
            take: 1,
          },
          trackingDays: {
            where: {
              date: { gte: weekRange.weekStartDate, lte: weekRange.weekEndDate },
            },
            select: {
              id: true,
              date: true,
              trackingEntries: {
                select: {
                  isCompleted: true,
                  scoreEarned: true,
                  notes: true,
                  worshipItem: {
                    select: {
                      title: true,
                      score: true,
                      category: { select: { name: true } },
                    },
                  },
                },
              },
            },
            orderBy: { date: 'desc' },
          },
        },
        orderBy: { fullName: 'asc' },
        take: 80,
      }),
      prisma.weeklyReview.count({
        where: {
          status: { in: ['PENDING', 'DRAFT'] },
          user: userWhere,
        },
      }),
    ]);

    const userCards = users.map((user) => {
      const todayDay = user.trackingDays.find((day) => toDateKey(day.date) === toDateKey(today));
      const weekEntries = user.trackingDays.flatMap((day) => day.trackingEntries);
      const possibleScore = sum(weekEntries, (entry) => entry.worshipItem?.score ?? 0);
      const completedScore = sum(weekEntries, (entry) => entry.scoreEarned ?? 0);
      const todayEntries = todayDay?.trackingEntries ?? [];
      const todayPossibleScore = sum(todayEntries, (entry) => entry.worshipItem?.score ?? 0);
      const todayScore = sum(todayEntries, (entry) => entry.scoreEarned ?? 0);
      const recentComments = user.trackingDays
        .flatMap((day) => day.trackingEntries
          .filter((entry) => entry.notes)
          .map((entry) => ({
            date: toDateKey(day.date),
            itemTitle: entry.worshipItem?.title,
            category: entry.worshipItem?.category?.name,
            note: entry.notes,
          })))
        .slice(0, 3);

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        region: user.region,
        mentor: user.mentorAssignmentsAsStudent[0]?.mentor ?? null,
        worshipLevel: user.userLevels[0]?.worshipLevel ?? null,
        today: {
          tracked: Boolean(todayDay),
          score: todayScore,
          possibleScore: todayPossibleScore,
          consistencyPercentage: percentage(todayScore, todayPossibleScore),
        },
        week: {
          activeDays: user.trackingDays.length,
          consistencyPercentage: percentage(completedScore, possibleScore),
          score: completedScore,
          possibleScore,
        },
        weakThisWeek: percentage(completedScore, possibleScore) < 50,
        recentComments,
      };
    });

    const missingToday = userCards.filter((user) => !user.today.tracked).length;
    const weakUsers = userCards.filter((user) => user.weakThisWeek).length;
    const averageConsistency = percentage(
      sum(userCards, (user) => user.week.consistencyPercentage),
      userCards.length * 100,
    );

    return {
      week: {
        weekStartDate: weekRange.weekStartKey,
        weekEndDate: weekRange.weekEndKey,
      },
      totals: {
        assignedUsers: userCards.length,
        activeToday: userCards.length - missingToday,
        missingToday,
        weakUsers,
        averageConsistency,
        pendingReviews,
      },
      users: userCards,
    };
  }
}
