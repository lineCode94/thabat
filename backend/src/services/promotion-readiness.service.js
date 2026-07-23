import { PROMOTION_CRITERIA } from '#config/promotion.config.js';
import { prisma } from '#lib/prisma.js';
import { PromotionAuthorizationService } from '#services/promotion-authorization.service.js';
import { StreakService } from '#services/streak.service.js';
import { ApiError } from '#utils/apiError.js';
import { addDays } from '#utils/week.js';

function weeksBetween(startDate, endDate = new Date()) {
  const ms = endDate.getTime() - new Date(startDate).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24 * 7)));
}

export class PromotionReadinessService {
  static async evaluate(actor, permissions, userId) {
    const user = await PromotionAuthorizationService.assertCanPromoteUser(actor, permissions, userId);
    const activeUserLevel = await prisma.userLevel.findFirst({
      where: { userId, isActive: true },
      include: { worshipLevel: true },
      orderBy: { assignedAt: 'desc' },
    });

    if (!activeUserLevel) {
      throw ApiError.badRequest('User does not have an active worship level');
    }

    const nextLevel = await prisma.worshipLevel.findFirst({
      where: {
        isActive: true,
        deletedAt: null,
        order: { gt: activeUserLevel.worshipLevel.order },
      },
      orderBy: { order: 'asc' },
    });

    if (!nextLevel) {
      throw ApiError.badRequest('No next active worship level is available');
    }

    const since = addDays(new Date(), -(PROMOTION_CRITERIA.minimumWeeksAtCurrentLevel * 7));
    const [activeItems, trackingDays, completedReviews, latestCompletedReview, streak] = await Promise.all([
      prisma.worshipItem.count({ where: { isActive: true, deletedAt: null } }),
      prisma.trackingDay.findMany({
        where: { userId, date: { gte: since } },
        select: {
          trackingEntries: { select: { isCompleted: true } },
        },
      }),
      prisma.weeklyReview.count({
        where: { userId, status: 'COMPLETED', weekStartDate: { gte: activeUserLevel.assignedAt } },
      }),
      prisma.weeklyReview.findFirst({
        where: { userId, status: 'COMPLETED' },
        select: { id: true, promotionSuggestion: true, completedAt: true },
        orderBy: { completedAt: 'desc' },
      }),
      StreakService.getStreakInfo(userId, user.timezone),
    ]);

    const totalPossible = activeItems * PROMOTION_CRITERIA.minimumWeeksAtCurrentLevel * 7;
    const completedEntries = trackingDays.reduce((sum, day) => (
      sum + day.trackingEntries.filter((entry) => entry.isCompleted).length
    ), 0);
    const consistencyPercent = totalPossible > 0
      ? Math.round((completedEntries / totalPossible) * 100)
      : 0;
    const weeksAtCurrentLevel = weeksBetween(activeUserLevel.assignedAt);

    const criteria = [
      {
        key: 'CONSISTENCY',
        passed: consistencyPercent >= PROMOTION_CRITERIA.minimumConsistencyPercent,
        currentValue: consistencyPercent,
        targetValue: PROMOTION_CRITERIA.minimumConsistencyPercent,
      },
      {
        key: 'TIME_AT_LEVEL',
        passed: weeksAtCurrentLevel >= PROMOTION_CRITERIA.minimumWeeksAtCurrentLevel,
        currentValue: weeksAtCurrentLevel,
        targetValue: PROMOTION_CRITERIA.minimumWeeksAtCurrentLevel,
      },
      {
        key: 'COMPLETED_REVIEWS',
        passed: completedReviews >= PROMOTION_CRITERIA.minimumCompletedReviews,
        currentValue: completedReviews,
        targetValue: PROMOTION_CRITERIA.minimumCompletedReviews,
      },
      {
        key: 'MENTOR_SUGGESTION',
        passed: Boolean(latestCompletedReview?.promotionSuggestion),
        currentValue: Boolean(latestCompletedReview?.promotionSuggestion),
        targetValue: true,
      },
    ];
    const passedCount = criteria.filter((criterion) => criterion.passed).length;
    const progress = Math.round((passedCount / criteria.length) * 100);

    return {
      eligible: criteria.every((criterion) => criterion.passed),
      recommendedLevel: {
        id: nextLevel.id,
        name: nextLevel.name,
        order: nextLevel.order,
      },
      currentLevel: {
        id: activeUserLevel.worshipLevel.id,
        name: activeUserLevel.worshipLevel.name,
        order: activeUserLevel.worshipLevel.order,
        assignedAt: activeUserLevel.assignedAt,
      },
      progress,
      criteria,
      context: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        trackingCompletionPercent: consistencyPercent,
        latestPromotionSuggestionReviewId: latestCompletedReview?.id ?? null,
      },
    };
  }
}
