import { Prisma } from '@prisma/client';

import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { prisma } from '#lib/prisma.js';
import { AuthorizationService } from '#services/authorization.service.js';
import { NotificationService } from '#services/notification.service.js';
import { StreakService } from '#services/streak.service.js';
import { ApiError } from '#utils/apiError.js';
import { getThabatWeekRange, toDateKey } from '#utils/week.js';

const REVIEW_SELECT = {
  id: true,
  mentorId: true,
  userId: true,
  weekStartDate: true,
  status: true,
  comment: true,
  privateNotes: true,
  rating: true,
  recommendation: true,
  promotionSuggestion: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  mentor: { select: { id: true, fullName: true } },
  user: { select: { id: true, fullName: true, email: true, regionId: true } },
};

const USER_SAFE_REVIEW_SELECT = {
  id: true,
  mentorId: true,
  userId: true,
  weekStartDate: true,
  status: true,
  comment: true,
  rating: true,
  recommendation: true,
  promotionSuggestion: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  mentor: { select: { id: true, fullName: true } },
};

function can(permissionBag, permission) {
  return AuthorizationService.hasPermission(permissionBag, permission);
}

export class WeeklyReviewService {
  static _permissionBag(actor, permissions) {
    return { ...actor, permissions };
  }

  static _serializeReview(review, { includePrivateNotes = false } = {}) {
    if (!review) return null;
    if (includePrivateNotes) return review;

    const safeReview = { ...review };
    delete safeReview.privateNotes;
    return safeReview;
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

  static async _assertCanManageUser(actor, permissions, userId) {
    const permissionBag = this._permissionBag(actor, permissions);
    const targetUser = await this._getTargetUser(userId);

    if (can(permissionBag, PERMISSIONS.REVIEWS_MANAGE_ALL)) {
      return targetUser;
    }

    if (
      can(permissionBag, PERMISSIONS.REVIEWS_MANAGE_REGION) &&
      AuthorizationService.isSameRegion(actor, targetUser.regionId)
    ) {
      return targetUser;
    }

    if (
      can(permissionBag, PERMISSIONS.REVIEWS_MANAGE_ASSIGNED) &&
      await AuthorizationService.isAssignedUser(actor.id, targetUser.id)
    ) {
      return targetUser;
    }

    throw ApiError.forbidden('You are not allowed to manage reviews for this user');
  }

  static async _assertCanViewReview(actor, permissions, review) {
    const permissionBag = this._permissionBag(actor, permissions);

    if (review.userId === actor.id) {
      if (!can(permissionBag, PERMISSIONS.REVIEWS_VIEW_OWN)) {
        throw ApiError.forbidden('Insufficient permissions');
      }
      if (review.status !== 'COMPLETED') {
        throw ApiError.notFound('Review not found');
      }
      return { includePrivateNotes: false };
    }

    await this._assertCanManageUser(actor, permissions, review.userId);
    return { includePrivateNotes: true };
  }

  static async _buildWeeklyContext(userId, timezone, weekRange) {
    const [activeItems, trackingDays, missions, streak] = await Promise.all([
      prisma.worshipItem.count({ where: { isActive: true, deletedAt: null } }),
      prisma.trackingDay.findMany({
        where: {
          userId,
          date: { gte: weekRange.weekStartDate, lte: weekRange.weekEndDate },
        },
        select: {
          id: true,
          date: true,
          status: true,
          trackingEntries: {
            select: {
              isCompleted: true,
              scoreEarned: true,
              worshipItem: { select: { id: true, title: true, score: true, xp: true } },
            },
          },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.userMission.findMany({
        where: { userId },
        select: {
          id: true,
          progress: true,
          completed: true,
          completionDate: true,
          mission: { select: { id: true, title: true, bonusXP: true } },
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
      }),
      StreakService.getStreakInfo(userId, timezone),
    ]);

    const totalPossible = activeItems * 7;
    const completedEntries = trackingDays.reduce((sum, day) => (
      sum + day.trackingEntries.filter((entry) => entry.isCompleted).length
    ), 0);
    const activeDays = trackingDays.length;
    const earnedScore = trackingDays.reduce((sum, day) => (
      sum + day.trackingEntries.reduce((entrySum, entry) => entrySum + (entry.scoreEarned || 0), 0)
    ), 0);
    const completionPercentage = totalPossible > 0
      ? Math.round((completedEntries / totalPossible) * 100)
      : 0;

    return {
      week: {
        startDate: weekRange.weekStartKey,
        endDate: weekRange.weekEndKey,
        closesAt: weekRange.weekEndDateTime.toISOString(),
      },
      completionPercentage,
      consistencyPercentage: Math.round((activeDays / 7) * 100),
      activeDays,
      trackingActivitySummary: {
        activeItems,
        totalPossible,
        completedEntries,
        earnedScore,
        days: trackingDays.map((day) => ({
          date: toDateKey(day.date),
          status: day.status,
          completedEntries: day.trackingEntries.filter((entry) => entry.isCompleted).length,
          scoreEarned: day.trackingEntries.reduce((sum, entry) => sum + (entry.scoreEarned || 0), 0),
        })),
      },
      streakContext: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        status: streak.streakStatus,
      },
      missionProgress: missions.map((userMission) => ({
        id: userMission.id,
        title: userMission.mission.title,
        progress: userMission.progress,
        completed: userMission.completed,
        completionDate: userMission.completionDate,
        bonusXP: userMission.mission.bonusXP,
      })),
    };
  }

  static async getCurrentReviewContext(actor, permissions, userId) {
    const targetUser = await this._assertCanManageUser(actor, permissions, userId);
    const weekRange = getThabatWeekRange(targetUser.timezone);

    const review = await prisma.weeklyReview.findUnique({
      where: { userId_weekStartDate: { userId, weekStartDate: weekRange.weekStartDate } },
      select: REVIEW_SELECT,
    });

    const context = await this._buildWeeklyContext(userId, targetUser.timezone, weekRange);

    return {
      user: targetUser,
      week: context.week,
      status: review?.status ?? 'PENDING',
      review: this._serializeReview(review, { includePrivateNotes: true }),
      context,
    };
  }

  static async createCurrentReview(actor, permissions, userId) {
    const targetUser = await this._assertCanManageUser(actor, permissions, userId);
    const weekRange = getThabatWeekRange(targetUser.timezone);

    try {
      const review = await prisma.weeklyReview.create({
        data: {
          mentorId: actor.id,
          userId,
          weekStartDate: weekRange.weekStartDate,
          status: 'PENDING',
        },
        select: REVIEW_SELECT,
      });

      return this._serializeReview(review, { includePrivateNotes: true });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw ApiError.badRequest('Weekly review already exists for this user and week');
      }
      throw error;
    }
  }

  static async listReviews(actor, permissions, query) {
    const permissionBag = this._permissionBag(actor, permissions);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = {};
    let includePrivateNotes = true;

    if (query.status) where.status = query.status;
    if (query.userId) where.userId = query.userId;

    if (can(permissionBag, PERMISSIONS.REVIEWS_MANAGE_ALL)) {
      // System-wide scope.
    } else if (can(permissionBag, PERMISSIONS.REVIEWS_MANAGE_REGION)) {
      where.user = { regionId: actor.regionId };
    } else if (can(permissionBag, PERMISSIONS.REVIEWS_MANAGE_ASSIGNED)) {
      where.user = {
        mentorAssignmentsAsStudent: {
          some: { mentorId: actor.id, isActive: true },
        },
      };
    } else if (can(permissionBag, PERMISSIONS.REVIEWS_VIEW_OWN)) {
      where.userId = actor.id;
      where.status = 'COMPLETED';
      includePrivateNotes = false;
    } else {
      throw ApiError.forbidden('Insufficient permissions');
    }

    const [total, reviews] = await Promise.all([
      prisma.weeklyReview.count({ where }),
      prisma.weeklyReview.findMany({
        where,
        select: includePrivateNotes ? REVIEW_SELECT : USER_SAFE_REVIEW_SELECT,
        orderBy: [{ weekStartDate: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      reviews: reviews.map((review) => this._serializeReview(review, { includePrivateNotes })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getReview(actor, permissions, id) {
    const review = await prisma.weeklyReview.findUnique({
      where: { id },
      select: REVIEW_SELECT,
    });

    if (!review) {
      throw ApiError.notFound('Review not found');
    }

    const { includePrivateNotes } = await this._assertCanViewReview(actor, permissions, review);

    if (!includePrivateNotes) {
      const userSafeReview = await prisma.weeklyReview.findUnique({
        where: { id },
        select: USER_SAFE_REVIEW_SELECT,
      });
      return this._serializeReview(userSafeReview);
    }

    return this._serializeReview(review, { includePrivateNotes: true });
  }

  static async updateReview(actor, permissions, id, payload) {
    const review = await prisma.weeklyReview.findUnique({
      where: { id },
      select: REVIEW_SELECT,
    });

    if (!review) {
      throw ApiError.notFound('Review not found');
    }

    await this._assertCanManageUser(actor, permissions, review.userId);

    if (review.status === 'COMPLETED') {
      throw ApiError.badRequest('Completed weekly reviews are immutable');
    }

    const nextStatus = Object.keys(payload).length > 0 ? 'DRAFT' : review.status;
    const updated = await prisma.weeklyReview.update({
      where: { id },
      data: {
        ...payload,
        status: nextStatus,
      },
      select: REVIEW_SELECT,
    });

    return this._serializeReview(updated, { includePrivateNotes: true });
  }

  static async completeReview(actor, permissions, id) {
    const review = await prisma.weeklyReview.findUnique({
      where: { id },
      select: REVIEW_SELECT,
    });

    if (!review) {
      throw ApiError.notFound('Review not found');
    }

    await this._assertCanManageUser(actor, permissions, review.userId);

    if (review.status === 'COMPLETED') {
      throw ApiError.badRequest('Completed weekly reviews are immutable');
    }

    const completed = await prisma.weeklyReview.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      select: REVIEW_SELECT,
    });

    await NotificationService.createNotification({
      userId: completed.userId,
      title: 'Weekly review completed',
      message: 'Your mentor completed your weekly review.',
      type: 'WEEKLY_REVIEW',
      priority: 'MEDIUM',
      metadata: {
        reviewId: completed.id,
        weekStartDate: toDateKey(completed.weekStartDate),
      },
    });

    return this._serializeReview(completed, { includePrivateNotes: true });
  }
}
