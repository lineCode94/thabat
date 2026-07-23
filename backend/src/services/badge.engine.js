import { StreakService } from './streak.service.js';

import { prisma } from '#lib/prisma.js';

const RAWATIB_TITLE_PARTS = ['السنة القبلية', 'السنة البعدية'];
const NIGHT_PRAYER_TWO_RAKAH_TITLE = 'القيام ركعتين';
const TAKBIRATUL_IHRAM_TITLE = 'تكبيرة الإحرام';
const MOSQUE_ENTRY_TITLE = 'دخول/خروج المسجد';
const WIRD_TITLE = 'قراءة الورد/حزب';
const QURAN_MEMORIZATION_TITLE = 'مراجعة/حفظ قرآن جديد';
const QURAN_RECITATION_REVIEW_TITLE = 'تسميع القرآن';
const LESSON_ATTENDANCE_TITLE = 'حضور المقرأة';
const DAWAH_TITLE = 'دعوة';

// ---------------------------------------------------------------------------
// Helper — format a UserBadge record into the standard badge DTO
// ---------------------------------------------------------------------------
function formatBadgeDto(badge, userBadge = null) {
  return {
    id: badge.id,
    key: badge.key,
    name: badge.name,
    description: badge.description,
    iconUrl: badge.iconUrl,
    category: badge.category,
    rarity: badge.rarity,
    isVisible: badge.isVisible,
    sortOrder: badge.sortOrder,
    isEarned: !!userBadge,
    earnedAt: userBadge?.earnedAt ?? null,
  };
}

let categoryCache = null;

// ---------------------------------------------------------------------------
// Badge Engine
// ---------------------------------------------------------------------------
export class BadgeEngine {
  /**
   * Helper to fetch and cache category IDs.
   */
  static async _getCategoryId(keyword) {
    if (!categoryCache) {
      const categories = await prisma.worshipCategory.findMany({
        where: { deletedAt: null },
      });
      categoryCache = categories;
    }
    const cat = categoryCache.find((c) =>
      c.name.toLowerCase().includes(keyword.toLowerCase()),
    );
    return cat ? cat.id : null;
  }
  // -------------------------------------------------------------------------
  // Core unlock logic — idempotent, safe to call multiple times
  // -------------------------------------------------------------------------

  /**
   * Attempts to award a badge by key. Returns the badge DTO if newly awarded,
   * or null if already earned or conditions not met.
   */
  static async _tryAward(userId, badgeKey, conditionMet) {
    if (!conditionMet) return null;

    // Idempotency check
    const badge = await prisma.badge.findUnique({
      where: { key: badgeKey },
    });
    if (!badge || !badge.isVisible || badge.deletedAt) return null;

    const existing = await prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
    });
    if (existing) return null; // Already earned

    const userBadge = await prisma.userBadge.create({
      data: { userId, badgeId: badge.id },
    });

    return {
      ...formatBadgeDto(badge, userBadge),
      newlyEarned: true,
    };
  }

  // -------------------------------------------------------------------------
  // Condition Checkers
  // -------------------------------------------------------------------------

  static async _countFajrCompleted(userId) {
    const fajrCategoryId = await this._getCategoryId('Fajr');
    if (!fajrCategoryId) return 0;

    return prisma.trackingEntry.count({
      where: {
        isCompleted: true,
        worshipItem: { categoryId: fajrCategoryId },
        trackingDay: { userId },
      },
    });
  }

  static async _countPrayerTotal(userId) {
    return prisma.trackingEntry.count({
      where: {
        isCompleted: true,
        worshipItem: {
          category: {
            name: { in: ['Fajr', 'الظهر', 'العصر', 'المغرب', 'العشاء', 'الليل'] },
          },
        },
        trackingDay: { userId },
      },
    });
  }

  static async _countQuranPages(userId) {
    const quranCategoryId = await this._getCategoryId('القرآن');
    if (!quranCategoryId) return 0;

    const agg = await prisma.trackingEntry.aggregate({
      where: {
        worshipItem: { categoryId: quranCategoryId },
        trackingDay: { userId },
      },
      _sum: { count: true },
    });
    return agg._sum.count || 0;
  }

  static _completedEntryWhere(userId, worshipItemWhere) {
    return {
      isCompleted: true,
      trackingDay: { userId },
      worshipItem: worshipItemWhere,
    };
  }

  static _rawatibWorshipItemWhere() {
    return {
      OR: RAWATIB_TITLE_PARTS.map((part) => ({
        title: { contains: part },
      })),
    };
  }

  static async _hasCompletedItem(userId, title) {
    const count = await prisma.trackingEntry.count({
      where: this._completedEntryWhere(userId, { title }),
    });
    return count > 0;
  }

  static async _hasCompletedRawatib(userId) {
    const count = await prisma.trackingEntry.count({
      where: this._completedEntryWhere(userId, this._rawatibWorshipItemWhere()),
    });
    return count > 0;
  }

  static _hasConsecutiveDateRun(dateSet, requiredDays) {
    if (dateSet.size < requiredDays) return false;

    for (const dateStr of dateSet) {
      let cursor = new Date(`${dateStr}T00:00:00Z`);
      let hasRun = true;

      for (let day = 0; day < requiredDays; day += 1) {
        if (!dateSet.has(StreakService._toDateStr(cursor))) {
          hasRun = false;
          break;
        }
        cursor = StreakService._subtractDays(cursor, 1);
      }

      if (hasRun) return true;
    }

    return false;
  }

  static async _getCompletedDateSet(userId, worshipItemWhere) {
    const entries = await prisma.trackingEntry.findMany({
      where: this._completedEntryWhere(userId, worshipItemWhere),
      select: { trackingDay: { select: { date: true } } },
      orderBy: { trackingDay: { date: 'asc' } },
    });

    return new Set(entries.map((entry) => StreakService._toDateStr(entry.trackingDay.date)));
  }

  static async _hasConsecutiveCompletedItemDays(userId, title, requiredDays) {
    const dateSet = await this._getCompletedDateSet(userId, { title });
    return this._hasConsecutiveDateRun(dateSet, requiredDays);
  }

  static async _hasConsecutiveRawatibDays(userId, requiredDays) {
    const dateSet = await this._getCompletedDateSet(userId, this._rawatibWorshipItemWhere());
    return this._hasConsecutiveDateRun(dateSet, requiredDays);
  }

  static async _hasConsecutiveDaysWithAllItems(userId, titles, requiredDays) {
    const dateSets = await Promise.all(
      titles.map((title) => this._getCompletedDateSet(userId, { title })),
    );

    if (dateSets.some((dateSet) => dateSet.size < requiredDays)) return false;

    const commonDates = new Set(
      [...dateSets[0]].filter((dateStr) => dateSets.every((dateSet) => dateSet.has(dateStr))),
    );

    return this._hasConsecutiveDateRun(commonDates, requiredDays);
  }

  static async _sumItemCount(userId, title) {
    const agg = await prisma.trackingEntry.aggregate({
      where: {
        trackingDay: { userId },
        worshipItem: { title },
      },
      _sum: { count: true },
    });

    return agg._sum.count || 0;
  }

  static async _getLatestTrackingScorePercentage(userId) {
    const trackingDay = await prisma.trackingDay.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
      include: {
        trackingEntries: {
          include: {
            worshipItem: {
              select: { score: true },
            },
          },
        },
      },
    });

    if (!trackingDay?.trackingEntries?.length) return 0;

    const possibleScore = trackingDay.trackingEntries.reduce((total, entry) => (
      total + Number(entry.worshipItem?.score ?? 0)
    ), 0);
    const earnedScore = trackingDay.trackingEntries.reduce((total, entry) => (
      total + Number(entry.scoreEarned ?? 0)
    ), 0);

    return possibleScore > 0 ? Math.round((earnedScore / possibleScore) * 100) : 0;
  }

  /** Count total XP for a user */
  static async _getTotalXp(userId) {
    const agg = await prisma.xPTransaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    return agg._sum.amount || 0;
  }

  /** Count completed missions for a user */
  static async _countCompletedMissions(userId) {
    return prisma.userMission.count({ where: { userId, completed: true } });
  }

  /** Count worship level promotions for a user */
  static async _countPromotions(userId) {
    return prisma.promotionRecommendation.count({
      where: { userId, status: 'APPROVED' },
    });
  }

  /** Days since user joined */
  static async _daysSinceJoining(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });
    if (!user) return 0;
    const ms = Date.now() - new Date(user.createdAt).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  }

  // -------------------------------------------------------------------------
  // Dedicated Evaluator Methods — called from other services on events
  // -------------------------------------------------------------------------

  /**
   * Evaluate badges triggered by a tracking save event.
   */
  static async evaluateTracking(userId) {
    const unlocked = [];

    const [
      completedTakbiratulIhram,
      completedRawatib,
      completedMosqueEntry,
      mosqueEntryWeek,
      rawatibWeek,
      nightPrayerTwoRakahWeek,
      takbiratulIhramMosqueFortyDays,
      completedWird,
      completedQuranMemorization,
      wirdWeek,
      completedQuranRecitationReview,
      wirdMonth,
      quranRecitationReviewMonth,
      khatmWirdCount,
      completedLessonAttendance,
      completedDawah,
      scorePercentage,
    ] = await Promise.all([
      this._hasCompletedItem(userId, TAKBIRATUL_IHRAM_TITLE),
      this._hasCompletedRawatib(userId),
      this._hasCompletedItem(userId, MOSQUE_ENTRY_TITLE),
      this._hasConsecutiveCompletedItemDays(userId, MOSQUE_ENTRY_TITLE, 7),
      this._hasConsecutiveRawatibDays(userId, 7),
      this._hasConsecutiveCompletedItemDays(userId, NIGHT_PRAYER_TWO_RAKAH_TITLE, 7),
      this._hasConsecutiveDaysWithAllItems(
        userId,
        [TAKBIRATUL_IHRAM_TITLE, MOSQUE_ENTRY_TITLE],
        40,
      ),
      this._hasCompletedItem(userId, WIRD_TITLE),
      this._hasCompletedItem(userId, QURAN_MEMORIZATION_TITLE),
      this._hasConsecutiveCompletedItemDays(userId, WIRD_TITLE, 7),
      this._hasCompletedItem(userId, QURAN_RECITATION_REVIEW_TITLE),
      this._hasConsecutiveCompletedItemDays(userId, WIRD_TITLE, 30),
      this._hasConsecutiveCompletedItemDays(userId, QURAN_RECITATION_REVIEW_TITLE, 30),
      this._sumItemCount(userId, WIRD_TITLE),
      this._hasCompletedItem(userId, LESSON_ATTENDANCE_TITLE),
      this._hasCompletedItem(userId, DAWAH_TITLE),
      this._getLatestTrackingScorePercentage(userId),
    ]);

    const candidates = [
      { key: 'takbiratul_ihram_daily', met: completedTakbiratulIhram },
      { key: 'rawatib_sunan_daily', met: completedRawatib },
      { key: 'mosque_entry_daily', met: completedMosqueEntry },
      { key: 'mosque_prayer_week', met: mosqueEntryWeek },
      { key: 'rawatib_sunan_week', met: rawatibWeek },
      { key: 'night_prayer_two_rakah_week', met: nightPrayerTwoRakahWeek },
      { key: 'takbiratul_ihram_mosque_40_days', met: takbiratulIhramMosqueFortyDays },
      { key: 'daily_wird_recitation', met: completedWird },
      { key: 'daily_quran_memorization', met: completedQuranMemorization },
      { key: 'weekly_wird_consistency', met: wirdWeek },
      { key: 'quran_recitation_review', met: completedQuranRecitationReview },
      { key: 'monthly_wird_consistency', met: wirdMonth },
      { key: 'monthly_quran_recitation_review', met: quranRecitationReviewMonth },
      { key: 'quran_khatm_604_pages', met: khatmWirdCount >= 604 },
      { key: 'lesson_attendance_daily', met: completedLessonAttendance },
      { key: 'dawah_invitation_daily', met: completedDawah },
      { key: 'daily_score_good', met: scorePercentage >= 50 },
      { key: 'daily_score_excellent', met: scorePercentage >= 90 },
    ];

    for (const { key, met } of candidates) {
      const badge = await this._tryAward(userId, key, met);
      if (badge) unlocked.push(badge);
    }

    return unlocked;
  }

  /**
   * Evaluate badges triggered by XP being awarded.
   */
  static async evaluateXP(userId) {
    void userId;
    return [];
  }

  /**
   * Evaluate badges triggered by streak recalculation.
   */
  static async evaluateStreak(userId, streakInfo) {
    void userId;
    void streakInfo;
    return [];

    // Consistent badge — 7-day streak
    // Strong Comeback — streak > 0 after a previous streak of 0 (comeback detected)
    // We treat a streak being active (>= 1) as a candidate for comeback evaluation
    // Comeback is only awarded once (idempotency handles it)
  }

  /**
   * Evaluate badges triggered by a mission completion.
   */
  static async evaluateMission(userId) {
    void userId;
    return [];
  }


  // -------------------------------------------------------------------------
  // Query Methods
  // -------------------------------------------------------------------------

  /**
   * Returns all badge definitions with earned status for a user.
   */
  static async getUserBadges(userId) {
    const [allBadges, userBadges] = await Promise.all([
      prisma.badge.findMany({
        where: { isVisible: true, deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
      }),
    ]);

    const earnedMap = new Map(userBadges.map((ub) => [ub.badgeId, ub]));

    return allBadges.map((badge) => formatBadgeDto(badge, earnedMap.get(badge.id) ?? null));
  }

  /**
   * Returns a single badge with earned status for a user.
   */
  static async getUserBadgeByKey(userId, key) {
    const badge = await prisma.badge.findUnique({
      where: { key },
    });
    if (!badge) return null;

    const userBadge = await prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
    });

    return formatBadgeDto(badge, userBadge);
  }

  /**
   * Returns the most recently earned badges for a user.
   */
  static async getRecentBadges(userId, limit = 3) {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
      take: limit,
    });

    return userBadges.map((ub) => formatBadgeDto(ub.badge, ub));
  }

  /**
   * Returns earned badge count and total visible badge count.
   */
  static async getBadgeProgress(userId) {
    const [total, earned] = await Promise.all([
      prisma.badge.count({ where: { isVisible: true, deletedAt: null } }),
      prisma.userBadge.count({ where: { userId } }),
    ]);

    return {
      total,
      earned,
      percentage: total > 0 ? Math.round((earned / total) * 100) : 0,
    };
  }
}
