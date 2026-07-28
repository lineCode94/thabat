import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '#constants/auditLog.js';
import { PAGINATION } from '#constants/index.js';
import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { QURAN_TOTAL_PAGES, QURAN_TRACK_TYPES, WEEKS_PER_MONTH } from '#constants/quran.js';
import { prisma } from '#lib/prisma.js';
import { AuditLogService } from '#services/audit-log.service.js';
import { AuthorizationService } from '#services/authorization.service.js';
import { BadgeEngine } from '#services/badge.engine.js';
import { GamificationNotificationService } from '#services/gamification-notification.service.js';
import { NotificationService } from '#services/notification.service.js';
import { ApiError } from '#utils/apiError.js';
import { getThabatWeekRange } from '#utils/week.js';

function can(permissionBag, permission) {
  return AuthorizationService.hasPermission(permissionBag, permission);
}

function toNumber(value) {
  return Number(value ?? 0);
}

function clampQuranTotal(value) {
  return Math.min(QURAN_TOTAL_PAGES, Math.max(0, Number(value)));
}

function juzToPages(juz) {
  return (Number(juz) / 30) * QURAN_TOTAL_PAGES;
}

function serializeProgress(progress, badges = []) {
  if (!progress) return null;

  const cumulativePagesMemorized = toNumber(progress.cumulativeJuzMemorized);
  const startingPagesMemorized = toNumber(progress.startingJuzMemorized);
  const weeklyTargetPages = progress.weeklyTargetJuz == null ? null : toNumber(progress.weeklyTargetJuz);
  const remainingPages = Math.max(0, QURAN_TOTAL_PAGES - cumulativePagesMemorized);
  const estimatedMonthsToCompletion = weeklyTargetPages > 0 && remainingPages > 0
    ? Math.ceil(remainingPages / weeklyTargetPages / WEEKS_PER_MONTH)
    : null;

  return {
    ...progress,
    startingPagesMemorized,
    cumulativePagesMemorized,
    weeklyTargetPages,
    remainingPages,
    estimatedMonthsToCompletion,
    startingJuzMemorized: undefined,
    cumulativeJuzMemorized: undefined,
    weeklyTargetJuz: undefined,
    badges,
  };
}

async function notifyQuranTransition(userId) {
  return NotificationService.createUniqueNotification({
    userId,
    type: 'QURAN',
    priority: 'HIGH',
    title: 'تم ختم حفظ القرآن',
    message: 'ما شاء الله، تم تحويل مسارك تلقائيًا إلى المراجعة الأسبوعية.',
    notificationKey: 'quran:transitioned-to-reviewing',
    metadata: {
      route: '/quran',
    },
  });
}

function serializeLog(log) {
  if (!log) return null;
  return {
    ...log,
    amountPages: toNumber(log.amountJuz),
    cumulativeAfter: log.cumulativeAfter == null ? null : toNumber(log.cumulativeAfter),
    amountJuz: undefined,
  };
}

export class QuranService {
  static _permissionBag(actor, permissions) {
    return { ...actor, permissions };
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

  static async _assertCanViewQuran(actor, permissions, targetUserId) {
    const permissionBag = this._permissionBag(actor, permissions);
    const targetUser = await this._getTargetUser(targetUserId);

    if (actor.id === targetUser.id && can(permissionBag, PERMISSIONS.QURAN_MANAGE_SELF)) {
      return targetUser;
    }

    if (can(permissionBag, PERMISSIONS.QURAN_VIEW_ALL)) {
      return targetUser;
    }

    if (
      can(permissionBag, PERMISSIONS.QURAN_VIEW_REGION)
      && AuthorizationService.isSameRegion(actor, targetUser.regionId)
    ) {
      return targetUser;
    }

    if (
      can(permissionBag, PERMISSIONS.QURAN_VIEW_ASSIGNED)
      && await AuthorizationService.isAssignedUser(actor.id, targetUser.id)
    ) {
      return targetUser;
    }

    throw ApiError.forbidden('You are not allowed to view Quran progress for this user');
  }

  static _assertCanManageSelf(actor, permissions) {
    const permissionBag = this._permissionBag(actor, permissions);
    if (!can(permissionBag, PERMISSIONS.QURAN_MANAGE_SELF)) {
      throw ApiError.forbidden('Insufficient permissions');
    }
  }

  static async getProgress(actor, permissions, query = {}) {
    const targetUserId = query.userId ?? actor.id;
    const targetUser = await this._assertCanViewQuran(actor, permissions, targetUserId);
    const [progress, badges] = await Promise.all([
      prisma.quranProgress.findUnique({ where: { userId: targetUser.id } }),
      BadgeEngine.getUserBadges(targetUser.id),
    ]);

    return {
      user: targetUser,
      progress: serializeProgress(progress, badges.filter((badge) => badge.category === 'Quran')),
    };
  }

  static async setup(actor, permissions, data) {
    this._assertCanManageSelf(actor, permissions);

    const existing = await prisma.quranProgress.findUnique({
      where: { userId: actor.id },
      select: { id: true },
    });

    if (existing) {
      throw ApiError.conflict('Quran progress is already configured', 'QURAN_PROGRESS_ALREADY_CONFIGURED');
    }

    const cumulative = clampQuranTotal(
      data.memorizedJuz == null
        ? data.cumulativePagesMemorized ?? data.cumulativeJuzMemorized ?? 0
        : juzToPages(data.memorizedJuz),
    );
    const weeklyTargetPages = data.weeklyTargetPages ?? data.weeklyTargetJuz;
    const trackType = data.trackType === QURAN_TRACK_TYPES.MEMORIZING && cumulative >= QURAN_TOTAL_PAGES
      ? QURAN_TRACK_TYPES.REVIEWING
      : data.trackType;

    const progress = await prisma.quranProgress.create({
      data: {
        userId: actor.id,
        trackType,
        startingJuzMemorized: cumulative,
        cumulativeJuzMemorized: cumulative,
        weeklyTargetJuz: weeklyTargetPages,
        startedAt: data.startedAt ?? new Date(),
      },
    });

    const newlyEarnedBadges = await BadgeEngine.evaluateQuran(actor.id);
    await Promise.all([
      GamificationNotificationService.notifyBadgesEarned(actor.id, newlyEarnedBadges),
      data.trackType !== trackType ? notifyQuranTransition(actor.id) : Promise.resolve(null),
    ]);

    return {
      progress: serializeProgress(progress),
      newlyEarnedBadges,
      transitionedToReviewing: data.trackType !== trackType,
    };
  }

  static async submitWeeklyLog(actor, permissions, data) {
    this._assertCanManageSelf(actor, permissions);

    const progress = await prisma.quranProgress.findUnique({
      where: { userId: actor.id },
    });

    if (!progress) {
      throw ApiError.badRequest('Quran progress is not configured', 'QURAN_PROGRESS_NOT_CONFIGURED');
    }

    const weekRange = getThabatWeekRange(actor.timezone, new Date());
    const existingLog = await prisma.quranWeeklyLog.findUnique({
      where: {
        userId_weekStartDate: {
          userId: actor.id,
          weekStartDate: weekRange.weekStartDate,
        },
      },
    });

    if (existingLog) {
      throw ApiError.conflict('Quran weekly log already exists for this week', 'QURAN_WEEKLY_LOG_ALREADY_EXISTS');
    }

    const result = await prisma.$transaction(async (tx) => {
      const beforeTrackType = progress.trackType;
      const amountPages = data.amountPages ?? data.amountJuz;
      const nextCumulative = clampQuranTotal(toNumber(progress.cumulativeJuzMemorized) + amountPages);
      const nextTrackType = beforeTrackType === QURAN_TRACK_TYPES.MEMORIZING && nextCumulative >= QURAN_TOTAL_PAGES
        ? QURAN_TRACK_TYPES.REVIEWING
        : beforeTrackType;

      const log = await tx.quranWeeklyLog.create({
        data: {
          userId: actor.id,
          quranProgressId: progress.id,
          weekStartDate: weekRange.weekStartDate,
          weekEndDate: weekRange.weekEndDate,
          trackType: beforeTrackType,
          amountJuz: amountPages,
          cumulativeAfter: nextCumulative,
        },
      });

      const updatedProgress = await tx.quranProgress.update({
        where: { id: progress.id },
        data: {
          cumulativeJuzMemorized: nextCumulative,
          trackType: nextTrackType,
          weeklyTargetJuz: progress.weeklyTargetJuz,
        },
      });

      return {
        log,
        progress: updatedProgress,
        transitionedToReviewing: beforeTrackType !== nextTrackType,
      };
    });

    const newlyEarnedBadges = await BadgeEngine.evaluateQuran(actor.id);
    await Promise.all([
      GamificationNotificationService.notifyBadgesEarned(actor.id, newlyEarnedBadges),
      result.transitionedToReviewing ? notifyQuranTransition(actor.id) : Promise.resolve(null),
    ]);

    return {
      log: serializeLog(result.log),
      progress: serializeProgress(result.progress),
      newlyEarnedBadges,
      transitionedToReviewing: result.transitionedToReviewing,
    };
  }

  static async updateWeeklyTarget(actor, permissions, data) {
    this._assertCanManageSelf(actor, permissions);

    const progress = await prisma.quranProgress.findUnique({
      where: { userId: actor.id },
    });

    if (!progress) {
      throw ApiError.badRequest('Quran progress is not configured', 'QURAN_PROGRESS_NOT_CONFIGURED');
    }

    const updatedProgress = await prisma.quranProgress.update({
      where: { id: progress.id },
      data: {
        weeklyTargetJuz: data.weeklyTargetPages,
      },
    });

    return {
      progress: serializeProgress(updatedProgress),
    };
  }

  static async getHistory(actor, permissions, query = {}) {
    const targetUserId = query.userId ?? actor.id;
    const targetUser = await this._assertCanViewQuran(actor, permissions, targetUserId);
    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where = { userId: targetUser.id };
    const [total, logs] = await Promise.all([
      prisma.quranWeeklyLog.count({ where }),
      prisma.quranWeeklyLog.findMany({
        where,
        orderBy: { weekStartDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      user: targetUser,
      logs: logs.map(serializeLog),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async correctWeeklyLog(actor, data, logId) {
    const correctedAmountPages = data.amountPages ?? data.amountJuz;
    const before = await prisma.quranWeeklyLog.findUnique({
      where: { id: logId },
      include: {
        user: { select: { id: true, regionId: true, timezone: true } },
        quranProgress: true,
      },
    });

    if (!before) {
      throw ApiError.notFound('Quran weekly log not found');
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.quranWeeklyLog.update({
        where: { id: logId },
        data: {
          amountJuz: correctedAmountPages,
          correctedAt: new Date(),
          correctedById: actor.id,
          correctionReason: data.reason,
        },
      });

      const logs = await tx.quranWeeklyLog.findMany({
        where: { userId: before.userId },
        orderBy: { weekStartDate: 'asc' },
      });

      let cumulative = toNumber(before.quranProgress.startingJuzMemorized);
      let finalTrackType = before.quranProgress.trackType;
      const updatedLogs = [];

      for (const log of logs) {
        const cumulativeAfter = clampQuranTotal(cumulative + toNumber(log.amountJuz));
        cumulative = cumulativeAfter;

        const updatedLog = await tx.quranWeeklyLog.update({
          where: { id: log.id },
          data: { cumulativeAfter },
        });
        updatedLogs.push(updatedLog);
      }

      if (cumulative >= QURAN_TOTAL_PAGES) {
        finalTrackType = QURAN_TRACK_TYPES.REVIEWING;
      }

      const progress = await tx.quranProgress.update({
        where: { id: before.quranProgressId },
        data: {
          cumulativeJuzMemorized: cumulative,
          trackType: finalTrackType,
          weeklyTargetJuz: before.quranProgress.weeklyTargetJuz,
        },
      });

      return {
        log: updatedLogs.find((log) => log.id === logId),
        progress,
      };
    });

    const newlyEarnedBadges = await BadgeEngine.evaluateQuran(before.userId);

    await AuditLogService.record({
      actorId: actor.id,
      action: AUDIT_ACTIONS.QURAN_WEEKLY_LOG_CORRECTED,
      targetType: AUDIT_TARGET_TYPES.QURAN_WEEKLY_LOG,
      targetId: before.id,
      regionId: before.user.regionId,
      metadata: {
        userId: before.userId,
        weekStartDate: before.weekStartDate.toISOString().slice(0, 10),
        reason: data.reason,
        changes: {
          amountPages: { from: toNumber(before.amountJuz), to: correctedAmountPages },
        },
      },
    });

    return {
      log: serializeLog(result.log),
      progress: serializeProgress(result.progress),
      newlyEarnedBadges,
    };
  }
}
