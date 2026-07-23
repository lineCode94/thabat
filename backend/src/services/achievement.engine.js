import { StreakService } from './streak.service.js';
import { XpService } from './xp.service.js';

import { prisma } from '#lib/prisma.js';

let categoryCache = null;

export class AchievementEngine {
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

  /**
   * Helper to map achievement names to target values.
   */
  static _getTargetValue(name) {
    switch (name) {
      case 'First Tracking': return 1;
      case '7 Day Streak': return 7;
      case '30 Day Streak': return 30;
      case '1000 XP': return 1000;
      case '100 Prayers Logged': return 100;
      case '500 Quran Pages': return 500;
      case 'First Weekly Mission': return 1;
      default: return 0;
    }
  }

  /**
   * Helper to map achievement names to category labels.
   */
  static _getCategory(name) {
    switch (name) {
      case 'First Tracking': return 'Getting Started';
      case '7 Day Streak':
      case '30 Day Streak': return 'Streak';
      case '1000 XP': return 'XP';
      case '100 Prayers Logged': return 'Prayer';
      case '500 Quran Pages': return 'Quran';
      case 'First Weekly Mission': return 'Mission';
      default: return 'General';
    }
  }

  /**
   * Calculates progress for an achievement.
   */
  static async _evaluateProgress(userId, name, timezone) {
    const targetValue = this._getTargetValue(name);

    switch (name) {
      case 'First Tracking': {
        const count = await prisma.trackingDay.count({ where: { userId } });
        return { currentValue: Math.min(count, targetValue), targetValue };
      }

      case '7 Day Streak':
      case '30 Day Streak': {
        const streakInfo = await StreakService.getStreakInfo(userId, timezone);
        const value = Math.max(streakInfo.currentStreak, streakInfo.longestStreak);
        return { currentValue: Math.min(value, targetValue), targetValue };
      }

      case '1000 XP': {
        const totalXp = await XpService.getTotalXp(userId);
        return { currentValue: Math.min(totalXp, targetValue), targetValue };
      }

      case '100 Prayers Logged': {
        const prayerCategoryId = await this._getCategoryId('prayer');
        if (!prayerCategoryId) return { currentValue: 0, targetValue };

        const count = await prisma.trackingEntry.count({
          where: {
            isCompleted: true,
            worshipItem: { categoryId: prayerCategoryId },
            trackingDay: { userId },
          },
        });
        return { currentValue: Math.min(count, targetValue), targetValue };
      }

      case '500 Quran Pages': {
        const quranCategoryId = await this._getCategoryId('quran');
        if (!quranCategoryId) return { currentValue: 0, targetValue };

        const aggregate = await prisma.trackingEntry.aggregate({
          where: {
            worshipItem: { categoryId: quranCategoryId },
            trackingDay: { userId },
          },
          _sum: { count: true },
        });
        const total = aggregate._sum.count || 0;
        return { currentValue: Math.min(total, targetValue), targetValue };
      }

      case 'First Weekly Mission': {
        const count = await prisma.userMission.count({
          where: { userId, completed: true },
        });
        return { currentValue: Math.min(count, targetValue), targetValue };
      }

      default:
        return { currentValue: 0, targetValue };
    }
  }

  /**
   * Evaluates unlock conditions and performs insertion if completed.
   * Returns achievement if newly unlocked, null otherwise.
   */
  static async _tryUnlock(userId, name, timezone) {
    // Check if already unlocked
    const existing = await prisma.userAchievement.findFirst({
      where: { userId, achievement: { name } },
      include: { achievement: true },
    });

    if (existing) return null; // Already unlocked

    const { currentValue, targetValue } = await this._evaluateProgress(userId, name, timezone);
    if (currentValue < targetValue) return null; // Milestone not reached

    const dbAchievement = await prisma.achievement.findUnique({
      where: { name },
    });

    if (!dbAchievement) return null;

    const userAchievement = await prisma.userAchievement.create({
      data: { userId, achievementId: dbAchievement.id },
      include: { achievement: true },
    });

    return {
      key: userAchievement.achievement.name,
      name: userAchievement.achievement.name,
      description: userAchievement.achievement.description,
      iconUrl: userAchievement.achievement.iconUrl,
      category: this._getCategory(userAchievement.achievement.name),
      state: 'UNLOCKED',
      progress: 100,
      currentValue: targetValue,
      targetValue,
      unlockedAt: userAchievement.earnedAt,
    };
  }

  // ---------------------------------------------------------------------------
  // Dedicated Evaluator Trigger Methods
  // ---------------------------------------------------------------------------

  static async evaluateTracking(userId, timezone = 'Africa/Cairo') {
    const names = ['First Tracking', '100 Prayers Logged', '500 Quran Pages'];
    const unlocked = [];
    for (const name of names) {
      const ach = await this._tryUnlock(userId, name, timezone);
      if (ach) unlocked.push(ach);
    }
    return unlocked;
  }

  static async evaluateStreak(userId, timezone = 'Africa/Cairo') {
    const names = ['7 Day Streak', '30 Day Streak'];
    const unlocked = [];
    for (const name of names) {
      const ach = await this._tryUnlock(userId, name, timezone);
      if (ach) unlocked.push(ach);
    }
    return unlocked;
  }

  static async evaluateXP(userId) {
    const name = '1000 XP';
    const ach = await this._tryUnlock(userId, name, 'Africa/Cairo');
    return ach ? [ach] : [];
  }

  static async evaluateMission(userId) {
    const name = 'First Weekly Mission';
    const ach = await this._tryUnlock(userId, name, 'Africa/Cairo');
    return ach ? [ach] : [];
  }

  // ---------------------------------------------------------------------------
  // Query Methods
  // ---------------------------------------------------------------------------

  static async getUserAchievements(userId, timezone = 'Africa/Cairo') {
    const dbAchievements = await prisma.achievement.findMany({
      where: { deletedAt: null },
    });

    const unlocked = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });

    const unlockedByName = new Map(
      unlocked.map(ua => [ua.achievement.name, ua])
    );

    return Promise.all(
      dbAchievements.map(async (ach) => {
        const unlockedRecord = unlockedByName.get(ach.name);
        const isUnlocked = !!unlockedRecord;

        let currentValue, targetValue;
        const target = this._getTargetValue(ach.name);

        if (isUnlocked) {
          currentValue = target;
          targetValue = target;
        } else {
          ({ currentValue, targetValue } = await this._evaluateProgress(userId, ach.name, timezone));
        }

        const progress = targetValue > 0 ? Math.round((currentValue / targetValue) * 100) : 0;

        let state = 'LOCKED';
        if (isUnlocked) state = 'UNLOCKED';
        else if (progress > 0) state = 'IN_PROGRESS';

        return {
          key: ach.name,
          name: ach.name,
          description: ach.description,
          iconUrl: ach.iconUrl,
          category: this._getCategory(ach.name),
          state,
          progress,
          currentValue,
          targetValue,
          unlockedAt: unlockedRecord?.earnedAt ?? null,
        };
      })
    );
  }

  static async getUserAchievementByKey(userId, name, timezone = 'Africa/Cairo') {
    const ach = await prisma.achievement.findUnique({ where: { name } });
    if (!ach) return null;

    const results = await this.getUserAchievements(userId, timezone);
    return results.find(a => a.name === name) ?? null;
  }

  static async getUserAchievementsProgress(userId, timezone = 'Africa/Cairo') {
    const achievements = await this.getUserAchievements(userId, timezone);
    const total = achievements.length;
    const unlocked = achievements.filter(a => a.state === 'UNLOCKED').length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

    return {
      total,
      unlocked,
      percentage,
    };
  }

  static async getRecentAchievements(userId, limit = 3) {
    const unlocked = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { earnedAt: 'desc' },
      take: limit,
    });

    return unlocked.map(ua => ({
      key: ua.achievement.name,
      name: ua.achievement.name,
      description: ua.achievement.description,
      iconUrl: ua.achievement.iconUrl,
      category: this._getCategory(ua.achievement.name),
      state: 'UNLOCKED',
      progress: 100,
      currentValue: this._getTargetValue(ua.achievement.name),
      targetValue: this._getTargetValue(ua.achievement.name),
      unlockedAt: ua.earnedAt,
    }));
  }
}
