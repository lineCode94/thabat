import { prisma } from '#lib/prisma.js';

const DEFAULT_PREFERENCES = {
  email: true,
  inApp: true,
  dailyReminders: true,
  weeklyReminders: true,
  achievements: true,
  missions: true,
  reminderTime: '07:30',
  quietHoursStart: null,
  quietHoursEnd: null,
};

/**
 * Formats a raw DB record into the safe API response DTO.
 * Strips internal fields (id, userId, createdAt, updatedAt).
 */
function formatPreferences(pref) {
  return {
    email: pref.email,
    inApp: pref.inApp,
    dailyReminders: pref.dailyReminders,
    weeklyReminders: pref.weeklyReminders,
    achievements: pref.achievements,
    missions: pref.missions,
    reminderTime: pref.reminderTime,
    quietHoursStart: pref.quietHoursStart,
    quietHoursEnd: pref.quietHoursEnd,
  };
}

export class NotificationPreferenceService {
  /**
   * Returns the user's notification preferences.
   * If no record exists, auto-creates one with sensible defaults (upsert pattern).
   */
  static async getPreferences(userId) {
    const pref = await prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...DEFAULT_PREFERENCES },
      update: {},
    });
    return formatPreferences(pref);
  }

  /**
   * Updates the user's notification preferences.
   * Only whitelisted fields are accepted — critical notifications cannot be disabled here.
   */
  static async updatePreferences(userId, updates) {
    const allowed = [
      'email',
      'inApp',
      'dailyReminders',
      'weeklyReminders',
      'achievements',
      'missions',
      'reminderTime',
      'quietHoursStart',
      'quietHoursEnd',
    ];

    const safeUpdates = {};
    for (const key of allowed) {
      if (key in updates) {
        safeUpdates[key] = updates[key];
      }
    }

    const pref = await prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...DEFAULT_PREFERENCES, ...safeUpdates },
      update: safeUpdates,
    });

    return formatPreferences(pref);
  }

  /**
   * Returns whether the user should receive a notification of a given type.
   * Critical system/administrative notifications always return true.
   */
  static async shouldNotify(userId, notificationType) {
    if (notificationType === 'ADMINISTRATIVE') return true; // cannot be disabled

    const pref = await this.getPreferences(userId);

    switch (notificationType) {
      case 'REMINDER':
        return pref.inApp && pref.dailyReminders;
      case 'ACHIEVEMENT':
      case 'BADGE':
        return pref.inApp && pref.achievements;
      case 'MISSION_ASSIGNED':
      case 'MISSION_COMPLETED':
      case 'MENTOR':
        return pref.inApp && pref.missions;
      default:
        return pref.inApp;
    }
  }
}
