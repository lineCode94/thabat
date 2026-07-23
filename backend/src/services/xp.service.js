import { prisma } from '#lib/prisma.js';

export class XpService {
  static async awardWorshipXp(userId, trackingEntry) {
    if (!trackingEntry.isCompleted) return [];

    // Fetch the worship item to know the XP value
    const worshipItem = await prisma.worshipItem.findUnique({
      where: { id: trackingEntry.worshipItemId },
    });

    if (!worshipItem || worshipItem.xp <= 0) return [];

    // Check if an XP transaction already exists for this tracking entry
    const existingTransaction = await prisma.xPTransaction.findFirst({
      where: {
        userId,
        sourceType: 'TRACKING_ENTRY',
        sourceId: trackingEntry.id,
      },
    });

    if (existingTransaction) return []; // Prevent duplicate XP

    // Award XP
    await prisma.xPTransaction.create({
      data: {
        userId,
        amount: worshipItem.xp,
        reason: `Completed worship: ${worshipItem.title}`,
        sourceType: 'TRACKING_ENTRY',
        sourceId: trackingEntry.id,
      },
    });

    // Re-evaluate achievements after XP changes
    const { AchievementEngine } = await import('./achievement.engine.js');
    const { BadgeEngine } = await import('./badge.engine.js');
    const newAchievements = await AchievementEngine.evaluateXP(userId);
    await BadgeEngine.evaluateXP(userId);
    return newAchievements;
  }

  static async awardMissionBonus(userId, userMission) {
    const bonusXP = userMission?.mission?.bonusXP ?? 0;
    if (bonusXP <= 0) return 0;

    const existingTransaction = await prisma.xPTransaction.findFirst({
      where: {
        userId,
        sourceType: 'USER_MISSION',
        sourceId: userMission.id,
      },
    });

    if (existingTransaction) return 0;

    await prisma.xPTransaction.create({
      data: {
        userId,
        amount: bonusXP,
        reason: `Completed mission: ${userMission.mission.title}`,
        sourceType: 'USER_MISSION',
        sourceId: userMission.id,
      },
    });

    const { AchievementEngine } = await import('./achievement.engine.js');
    const { BadgeEngine } = await import('./badge.engine.js');
    await AchievementEngine.evaluateXP(userId);
    await BadgeEngine.evaluateXP(userId);

    return bonusXP;
  }

  /**
   * Retrieves the total XP for a user by summing all their transactions.
   */
  static async getTotalXp(userId) {
    const aggregate = await prisma.xPTransaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    return aggregate._sum.amount || 0;
  }
}
