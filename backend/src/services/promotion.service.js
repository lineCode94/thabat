import { Prisma } from '@prisma/client';

import { prisma } from '#lib/prisma.js';
import { AchievementEngine } from '#services/achievement.engine.js';
import { BadgeEngine } from '#services/badge.engine.js';
import { NotificationService } from '#services/notification.service.js';
import { PromotionAuthorizationService } from '#services/promotion-authorization.service.js';
import { PromotionReadinessService } from '#services/promotion-readiness.service.js';
import { ApiError } from '#utils/apiError.js';

const PROMOTION_INCLUDE = {
  user: { select: { id: true, fullName: true, email: true, regionId: true } },
  recommendedBy: { select: { id: true, fullName: true } },
  previousLevel: { select: { id: true, name: true, order: true } },
  nextLevel: { select: { id: true, name: true, order: true } },
  approvedBy: { select: { id: true, fullName: true } },
  declinedBy: { select: { id: true, fullName: true } },
};

export class PromotionService {
  static async createRecommendation(actor, permissions, userId, payload = {}) {
    await PromotionAuthorizationService.assertCanPromoteUser(actor, permissions, userId);
    const readiness = await PromotionReadinessService.evaluate(actor, permissions, userId);

    const pending = await prisma.promotionRecommendation.findFirst({
      where: { userId, status: 'PENDING' },
      select: { id: true },
    });

    if (pending) {
      throw ApiError.badRequest('A pending promotion recommendation already exists for this user');
    }

    try {
      return prisma.promotionRecommendation.create({
        data: {
          userId,
          recommendedById: actor.id,
          previousLevelId: readiness.currentLevel.id,
          nextLevelId: readiness.recommendedLevel.id,
          readinessSnapshot: readiness,
          reason: payload.reason,
        },
        include: PROMOTION_INCLUDE,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw ApiError.badRequest('Promotion recommendation already exists');
      }
      throw error;
    }
  }

  static async listPromotions(actor, permissions, query) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = {
      ...PromotionAuthorizationService.scopedPromotionWhere(actor, permissions),
      ...(query.status ? { status: query.status } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
    };

    const [total, promotions] = await Promise.all([
      prisma.promotionRecommendation.count({ where }),
      prisma.promotionRecommendation.findMany({
        where,
        include: PROMOTION_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      promotions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getPromotion(actor, permissions, id) {
    const promotion = await prisma.promotionRecommendation.findUnique({
      where: { id },
      include: PROMOTION_INCLUDE,
    });
    if (!promotion) throw ApiError.notFound('Promotion recommendation not found');
    await PromotionAuthorizationService.assertCanPromoteUser(actor, permissions, promotion.userId);
    return promotion;
  }

  static async approve(actor, permissions, id) {
    const promotion = await prisma.promotionRecommendation.findUnique({
      where: { id },
      include: PROMOTION_INCLUDE,
    });
    if (!promotion) throw ApiError.notFound('Promotion recommendation not found');
    await PromotionAuthorizationService.assertCanPromoteUser(actor, permissions, promotion.userId);

    if (promotion.status !== 'PENDING') {
      throw ApiError.badRequest('Promotion recommendation is no longer actionable');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const activeUserLevel = await tx.userLevel.findFirst({
        where: { userId: promotion.userId, isActive: true },
        orderBy: { assignedAt: 'desc' },
      });

      if (!activeUserLevel || activeUserLevel.levelId !== promotion.previousLevelId) {
        throw ApiError.badRequest('User current worship level has changed');
      }

      const nextLevel = await tx.worshipLevel.findFirst({
        where: { id: promotion.nextLevelId, isActive: true, deletedAt: null },
        select: { id: true },
      });
      if (!nextLevel) throw ApiError.badRequest('Target worship level is no longer valid');

      await tx.userLevel.updateMany({
        where: { userId: promotion.userId, isActive: true },
        data: { isActive: false },
      });

      await tx.userLevel.create({
        data: {
          userId: promotion.userId,
          levelId: promotion.nextLevelId,
          isActive: true,
          promotedById: actor.id,
        },
      });

      const approved = await tx.promotionRecommendation.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: actor.id,
          approvedAt: new Date(),
        },
        include: PROMOTION_INCLUDE,
      });

      await tx.journeyEvent.create({
        data: {
          userId: promotion.userId,
          eventType: 'WORSHIP_LEVEL_PROMOTED',
          metadata: {
            promotionId: promotion.id,
            previousLevelId: promotion.previousLevelId,
            nextLevelId: promotion.nextLevelId,
          },
        },
      });

      return approved;
    });

    await NotificationService.createNotification({
      userId: updated.userId,
      title: 'Worship level updated',
      message: `You have been promoted to ${updated.nextLevel.name}. Keep going with steadiness.`,
      type: 'WORSHIP_LEVEL_PROMOTION',
      priority: 'MEDIUM',
      metadata: { promotionId: updated.id, nextLevelId: updated.nextLevelId },
    });

    await Promise.all([
      AchievementEngine.evaluateXP(updated.userId),
      BadgeEngine.evaluateXP(updated.userId),
    ]);

    return updated;
  }

  static async decline(actor, permissions, id, payload = {}) {
    const promotion = await prisma.promotionRecommendation.findUnique({
      where: { id },
      include: PROMOTION_INCLUDE,
    });
    if (!promotion) throw ApiError.notFound('Promotion recommendation not found');
    await PromotionAuthorizationService.assertCanPromoteUser(actor, permissions, promotion.userId);

    if (promotion.status !== 'PENDING') {
      throw ApiError.badRequest('Promotion recommendation is no longer actionable');
    }

    return prisma.promotionRecommendation.update({
      where: { id },
      data: {
        status: 'DECLINED',
        declinedById: actor.id,
        declinedAt: new Date(),
        decisionNotes: payload.decisionNotes,
      },
      include: PROMOTION_INCLUDE,
    });
  }
}
