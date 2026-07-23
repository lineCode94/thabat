import { prisma } from '#lib/prisma.js';
import { NotificationService } from '#services/notification.service.js';

const ROUTES = {
  ACHIEVEMENT: '/achievements',
  BADGE: '/badges',
};

function getEntityKey(prefix, entity) {
  return `${prefix}:${entity.id ?? entity.key ?? entity.name}`;
}

async function createOnce({ userId, notificationKey, title, message, type, metadata }) {
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type,
      metadata: {
        path: ['notificationKey'],
        equals: notificationKey,
      },
    },
    select: { id: true },
  });

  if (existing) return null;

  return NotificationService.createNotification({
    userId,
    title,
    message,
    type,
    priority: 'HIGH',
    metadata: {
      ...metadata,
      notificationKey,
    },
  });
}

export class GamificationNotificationService {
  static async notifyAchievementsUnlocked(userId, achievements = []) {
    if (!achievements.length) return [];

    const notifications = await Promise.all(
      achievements.map((achievement) => {
        const notificationKey = getEntityKey('achievement', achievement);

        return createOnce({
          userId,
          notificationKey,
          type: 'ACHIEVEMENT',
          title: `Achievement unlocked: ${achievement.name}`,
          message: achievement.description ?? 'You unlocked a new achievement in THABAT.',
          metadata: {
            achievementId: achievement.id ?? null,
            achievementKey: achievement.key ?? achievement.name,
            route: ROUTES.ACHIEVEMENT,
          },
        });
      }),
    );

    return notifications.filter(Boolean);
  }

  static async notifyBadgesEarned(userId, badges = []) {
    if (!badges.length) return [];

    const notifications = await Promise.all(
      badges.map((badge) => {
        const notificationKey = getEntityKey('badge', badge);

        return createOnce({
          userId,
          notificationKey,
          type: 'BADGE',
          title: `Badge earned: ${badge.name}`,
          message: badge.description ?? 'You earned a new badge in THABAT.',
          metadata: {
            badgeId: badge.id ?? null,
            badgeKey: badge.key ?? badge.name,
            route: ROUTES.BADGE,
          },
        });
      }),
    );

    return notifications.filter(Boolean);
  }
}
