import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { prisma } from '#lib/prisma.js';
import { AuthorizationService } from '#services/authorization.service.js';
import { StreakService } from '#services/streak.service.js';
import { ApiError } from '#utils/apiError.js';
import { addDays, getThabatWeekRange } from '#utils/week.js';

const REPORT_TYPE = 'WEEKLY';

function can(permissionBag, permission) {
  return AuthorizationService.hasPermission(permissionBag, permission);
}

function percentage(part, total) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function sum(entries, selector) {
  return entries.reduce((total, entry) => total + selector(entry), 0);
}

function isItemAvailableOnDate(item, date) {
  const dayOfWeek = date.getUTCDay();
  return !item.daysOfWeek?.length || item.daysOfWeek.includes(dayOfWeek);
}

export class WeeklyReportService {
  static _permissionBag(actor, permissions) {
    return { ...actor, permissions };
  }

  static _parseDateKey(dateKey) {
    if (!dateKey) return null;
    return new Date(`${dateKey}T00:00:00Z`);
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

  static async _assertCanViewReport(actor, permissions, targetUserId) {
    const permissionBag = this._permissionBag(actor, permissions);
    const targetUser = await this._getTargetUser(targetUserId);

    if (actor.id === targetUser.id && can(permissionBag, PERMISSIONS.REPORTS_VIEW_OWN)) {
      return targetUser;
    }

    if (can(permissionBag, PERMISSIONS.REPORTS_VIEW_ALL)) {
      return targetUser;
    }

    if (
      can(permissionBag, PERMISSIONS.REPORTS_VIEW_REGION)
      && AuthorizationService.isSameRegion(actor, targetUser.regionId)
    ) {
      return targetUser;
    }

    if (
      can(permissionBag, PERMISSIONS.REPORTS_VIEW_ASSIGNED)
      && await AuthorizationService.isAssignedUser(actor.id, targetUser.id)
    ) {
      return targetUser;
    }

    throw ApiError.forbidden('You are not allowed to view reports for this user');
  }

  static async getWeeklyReport(actor, permissions, query = {}) {
    const targetUserId = query.userId ?? actor.id;
    const targetUser = await this._assertCanViewReport(actor, permissions, targetUserId);
    const weekAnchorDate = this._parseDateKey(query.weekStartDate) ?? new Date();
    const weekRange = getThabatWeekRange(targetUser.timezone, weekAnchorDate, {
      applyDayBoundary: !query.weekStartDate,
    });

    const existingReport = await prisma.report.findUnique({
      where: {
        userId_type_periodStartDate: {
          userId: targetUser.id,
          type: REPORT_TYPE,
          periodStartDate: weekRange.weekStartDate,
        },
      },
    });

    if (existingReport) {
      return { report: await this._withBreakdownCategories(existingReport), generated: false };
    }

    const isPastClosedWeek = weekRange.weekEndDateTime.getTime() < Date.now();
    if (!isPastClosedWeek) {
      throw ApiError.badRequest('Weekly report can only be generated after the week is closed', 'WEEK_NOT_CLOSED');
    }

    const hasReopenedDay = await prisma.trackingDay.findFirst({
      where: {
        userId: targetUser.id,
        date: { gte: weekRange.weekStartDate, lte: weekRange.weekEndDate },
        status: 'REOPENED',
      },
      select: { id: true },
    });

    if (hasReopenedDay) {
      throw ApiError.badRequest('Weekly report can only be generated after the reopened week is closed again', 'WEEK_NOT_CLOSED');
    }

    const data = await this._buildWeeklyReportData(targetUser, weekRange);
    const report = await prisma.report.create({
      data: {
        userId: targetUser.id,
        type: REPORT_TYPE,
        periodStartDate: weekRange.weekStartDate,
        periodEndDate: weekRange.weekEndDate,
        data,
      },
    });

    return { report, generated: true };
  }

  static async _withBreakdownCategories(report) {
    const breakdown = report.data?.worshipBreakdown;
    const dailyBreakdown = report.data?.dailyWorshipBreakdown;
    let nextReport = report;
    const itemIds = new Set([
      ...(Array.isArray(breakdown)
        ? breakdown.map((item) => item.worshipItemId).filter(Boolean)
        : []),
      ...(Array.isArray(dailyBreakdown?.items)
        ? dailyBreakdown.items.map((item) => item.worshipItemId).filter(Boolean)
        : []),
    ]);
    let itemsById = new Map();

    if (itemIds.size > 0) {
      const worshipItems = await prisma.worshipItem.findMany({
        where: { id: { in: Array.from(itemIds) } },
        select: {
          id: true,
          title: true,
          category: {
            select: {
              name: true,
              order: true,
            },
          },
        },
      });
      itemsById = new Map(worshipItems.map((item) => [item.id, item]));
    }

    if (Array.isArray(breakdown) && !breakdown.every((item) => item.category)) {
      nextReport = {
        ...nextReport,
        data: {
          ...nextReport.data,
          worshipBreakdown: breakdown.map((item) => {
            const worshipItem = itemsById.get(item.worshipItemId);

            return {
              ...item,
              title: worshipItem?.title ?? item.title,
              category: item.category ?? worshipItem?.category ?? null,
            };
          }),
        },
      };
    }

    const dailyWorshipBreakdown = await this._buildDailyWorshipBreakdown(
      nextReport.userId,
      nextReport.periodStartDate,
      nextReport.periodEndDate,
    );

    nextReport = {
      ...nextReport,
      data: {
        ...nextReport.data,
        dailyWorshipBreakdown,
      },
    };

    return nextReport;
  }

  static _buildWeekDays(weekStartDate, weekEndDate) {
    const days = [];
    for (
      let current = new Date(weekStartDate);
      current <= weekEndDate;
      current = addDays(current, 1)
    ) {
      days.push({
        date: current.toISOString().slice(0, 10),
        weekdayIndex: current.getUTCDay(),
      });
    }
    return days;
  }

  static async _buildDailyWorshipBreakdown(userId, weekStartDate, weekEndDate) {
    const days = this._buildWeekDays(weekStartDate, weekEndDate);
    const [activeUserLevel, customRequirements, excludedRequirements, trackingDays] = await Promise.all([
      prisma.userLevel.findFirst({
        where: {
          userId,
          isActive: true,
          worshipLevel: {
            isActive: true,
            deletedAt: null,
          },
        },
        select: {
          levelId: true,
          worshipLevel: {
            select: {
              requirements: {
                include: {
                  worshipItem: {
                    include: { category: true },
                  },
                },
                orderBy: [
                  { worshipItem: { category: { order: 'asc' } } },
                  { worshipItem: { order: 'asc' } },
                ],
              },
            },
          },
        },
        orderBy: [
          { assignedAt: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.userCustomRequirement.findMany({
        where: { userId },
        include: {
          worshipItem: {
            include: { category: true },
          },
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
      prisma.trackingDay.findMany({
      where: {
        userId,
        date: { gte: weekStartDate, lte: weekEndDate },
      },
      select: {
        id: true,
        date: true,
        trackingEntries: {
          select: {
            id: true,
            isCompleted: true,
            scoreEarned: true,
            notes: true,
            worshipItem: {
              select: {
                id: true,
                title: true,
                score: true,
                xp: true,
                category: {
                  select: {
                    name: true,
                    order: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
      }),
    ]);

    const rowByItemId = new Map();
    const totalsByDate = new Map(days.map((day) => [day.date, {
      date: day.date,
      completedItems: 0,
      totalItems: 0,
      scoreEarned: 0,
      possibleScore: 0,
    }]));
    const excludedItemIds = new Set(excludedRequirements.map((requirement) => requirement.worshipItemId));
    const scheduledItemsById = new Map();

    activeUserLevel?.worshipLevel?.requirements?.forEach((requirement) => {
      const item = requirement.worshipItem;
      if (item && !excludedItemIds.has(item.id)) {
        scheduledItemsById.set(item.id, item);
      }
    });

    customRequirements.forEach((requirement) => {
      const item = requirement.worshipItem;
      if (item) {
        scheduledItemsById.set(item.id, item);
      }
    });

    Array.from(scheduledItemsById.values())
      .filter((item) => (
        item?.isActive
        && !item.deletedAt
        && item.category?.isActive
        && !item.category?.deletedAt
      ))
      .sort((first, second) => {
        const categoryOrder = (first.category?.order ?? 0) - (second.category?.order ?? 0);
        if (categoryOrder !== 0) return categoryOrder;
        return (first.order ?? 0) - (second.order ?? 0);
      })
      .forEach((item) => {
        const current = {
          worshipItemId: item.id,
          title: item.title,
          score: item.score ?? 0,
          category: item.category
            ? {
                name: item.category.name,
                order: item.category.order,
              }
            : null,
          days: days.map((day) => {
            const date = new Date(`${day.date}T00:00:00Z`);
            const isAssigned = isItemAvailableOnDate(item, date);

            if (isAssigned) {
              const dayTotals = totalsByDate.get(day.date);
              if (dayTotals) {
                dayTotals.totalItems += 1;
                dayTotals.possibleScore += item.score ?? 0;
              }
            }

            return {
              date: day.date,
              isAssigned,
              isCompleted: false,
              scoreEarned: 0,
            };
          }),
          completedDays: 0,
          totalDays: 0,
          scoreEarned: 0,
          possibleScore: 0,
        };

        current.totalDays = current.days.filter((day) => day.isAssigned).length;
        current.possibleScore = current.totalDays * (item.score ?? 0);
        rowByItemId.set(item.id, current);
      });

    trackingDays.forEach((trackingDay) => {
      const dateKey = trackingDay.date.toISOString().slice(0, 10);
      const dayTotals = totalsByDate.get(dateKey);

      trackingDay.trackingEntries.forEach((entry) => {
        const item = entry.worshipItem;
        if (!item) return;

        const current = rowByItemId.get(item.id) ?? {
          worshipItemId: item.id,
          title: item.title,
          score: item.score ?? 0,
          category: item.category
            ? {
                name: item.category.name,
                order: item.category.order,
              }
            : null,
          days: days.map((day) => ({
            date: day.date,
            isAssigned: false,
            isCompleted: false,
            scoreEarned: 0,
          })),
          completedDays: 0,
          totalDays: 0,
          scoreEarned: 0,
          possibleScore: 0,
        };

        const dayCell = current.days.find((day) => day.date === dateKey);
        if (dayCell) {
          const wasAssigned = dayCell.isAssigned;
          dayCell.isAssigned = true;
          dayCell.isCompleted = Boolean(entry.isCompleted);
          dayCell.scoreEarned = entry.isCompleted ? (item.score ?? 0) : 0;
          if (entry.notes) {
            dayCell.notes = entry.notes;
          }

          if (!wasAssigned) {
            current.totalDays += 1;
            current.possibleScore += item.score ?? 0;
            if (dayTotals) {
              dayTotals.totalItems += 1;
              dayTotals.possibleScore += item.score ?? 0;
            }
          }
        }
        if (entry.isCompleted) {
          current.completedDays += 1;
          current.scoreEarned += item.score ?? 0;
        }

        if (dayTotals) {
          if (entry.isCompleted) {
            dayTotals.completedItems += 1;
            dayTotals.scoreEarned += item.score ?? 0;
          }
        }

        rowByItemId.set(item.id, current);
      });
    });

    const items = Array.from(rowByItemId.values()).map((item) => ({
      ...item,
      completionPercentage: percentage(item.completedDays, item.totalDays),
    }));

    return {
      days,
      dayTotals: Array.from(totalsByDate.values()).map((day) => ({
        ...day,
        completionPercentage: percentage(day.completedItems, day.totalItems),
      })),
      items,
    };
  }

  static async _buildWeeklyReportData(user, weekRange) {
    const previousWeekRange = getThabatWeekRange(user.timezone, addDays(weekRange.weekStartDate, -7));
    const [current, previous, streak, achievements, weeklyReview] = await Promise.all([
      this._buildWeekMetrics(user.id, weekRange),
      this._buildWeekMetrics(user.id, previousWeekRange),
      StreakService.getStreakInfo(user.id, user.timezone),
      prisma.userAchievement.findMany({
        where: {
          userId: user.id,
          earnedAt: { gte: weekRange.weekStartDate, lte: weekRange.weekEndDateTime },
        },
        select: {
          id: true,
          earnedAt: true,
          achievement: { select: { id: true, name: true, description: true, iconUrl: true } },
        },
        orderBy: { earnedAt: 'desc' },
      }),
      prisma.weeklyReview.findUnique({
        where: {
          userId_weekStartDate: {
            userId: user.id,
            weekStartDate: weekRange.weekStartDate,
          },
        },
        select: {
          id: true,
          status: true,
          rating: true,
          comment: true,
          recommendation: true,
          completedAt: true,
        },
      }),
    ]);

    return {
      type: REPORT_TYPE,
      week: {
        weekStartDate: weekRange.weekStartKey,
        weekEndDate: weekRange.weekEndKey,
        generatedAt: new Date().toISOString(),
      },
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        regionId: user.regionId,
      },
      totals: current.totals,
      worshipBreakdown: current.worshipBreakdown,
      dailyWorshipBreakdown: current.dailyWorshipBreakdown,
      streak: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        streakStatus: streak.streakStatus,
        lastCompletedDate: streak.lastCompletedDate,
      },
      comparison: {
        previousWeekStartDate: previousWeekRange.weekStartKey,
        xpDelta: current.totals.xpEarned - previous.totals.xpEarned,
        consistencyDelta: current.totals.consistencyPercentage - previous.totals.consistencyPercentage,
        completionDelta: current.totals.worshipCompletionPercentage - previous.totals.worshipCompletionPercentage,
      },
      achievements: achievements.map((achievement) => ({
        id: achievement.achievement.id,
        name: achievement.achievement.name,
        description: achievement.achievement.description,
        iconUrl: achievement.achievement.iconUrl,
        earnedAt: achievement.earnedAt,
      })),
      mentorFeedback: weeklyReview?.status === 'COMPLETED'
        ? {
          reviewId: weeklyReview.id,
          rating: weeklyReview.rating,
          comment: weeklyReview.comment,
          recommendation: weeklyReview.recommendation,
          completedAt: weeklyReview.completedAt,
        }
        : null,
    };
  }

  static async _buildWeekMetrics(userId, weekRange) {
    const trackingDays = await prisma.trackingDay.findMany({
      where: {
        userId,
        date: { gte: weekRange.weekStartDate, lte: weekRange.weekEndDate },
      },
      select: {
        id: true,
        date: true,
        trackingEntries: {
          select: {
            id: true,
            isCompleted: true,
            scoreEarned: true,
            worshipItem: {
              select: {
                id: true,
                title: true,
                score: true,
                xp: true,
                category: {
                  select: {
                    name: true,
                    order: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    const xp = await prisma.xPTransaction.aggregate({
      where: {
        userId,
        createdAt: { gte: weekRange.weekStartDate, lte: weekRange.weekEndDateTime },
        sourceType: 'TRACKING_ENTRY',
      },
      _sum: { amount: true },
    });

    const entries = trackingDays.flatMap((day) => day.trackingEntries);
    const completedEntries = entries.filter((entry) => entry.isCompleted);
    const possibleScore = sum(entries, (entry) => entry.worshipItem?.score ?? 0);
    const completedScore = sum(completedEntries, (entry) => entry.worshipItem?.score ?? 0);
    const breakdownByItem = new Map();

    entries.forEach((entry) => {
      const item = entry.worshipItem;
      if (!item) return;

      const current = breakdownByItem.get(item.id) ?? {
        worshipItemId: item.id,
        title: item.title,
        category: item.category
          ? {
              name: item.category.name,
              order: item.category.order,
            }
          : null,
        totalDays: 0,
        completedDays: 0,
        scoreEarned: 0,
        possibleScore: 0,
      };
      current.totalDays += 1;
      current.possibleScore += item.score ?? 0;
      current.scoreEarned += entry.isCompleted ? (item.score ?? 0) : 0;
      if (entry.isCompleted) {
        current.completedDays += 1;
      }
      breakdownByItem.set(item.id, current);
    });

    const worshipBreakdown = Array.from(breakdownByItem.values()).map((item) => ({
      ...item,
      completionPercentage: percentage(item.completedDays, item.totalDays),
    }));
    const dailyWorshipBreakdown = await this._buildDailyWorshipBreakdown(
      userId,
      weekRange.weekStartDate,
      weekRange.weekEndDate,
    );

    return {
      totals: {
        xpEarned: xp._sum.amount ?? 0,
        consistencyPercentage: percentage(completedScore, possibleScore),
        worshipCompletionPercentage: percentage(completedEntries.length, entries.length),
        completedItems: completedEntries.length,
        totalAssignedItems: entries.length,
        completedScore,
        possibleScore,
        activeTrackingDays: trackingDays.length,
      },
      worshipBreakdown,
      dailyWorshipBreakdown,
    };
  }
}
