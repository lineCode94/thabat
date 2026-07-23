import { prisma } from '#lib/prisma.js';
import { NotificationPreferenceService } from '#services/notification-preference.service.js';

export class NotificationService {
  /**
   * Creates a notification for a user.
   * If priority is not provided, defaults to MEDIUM.
   */
  static async createNotification({ userId, title, message, type, priority = 'MEDIUM', metadata = {} }) {
    const shouldNotify = await NotificationPreferenceService.shouldNotify(userId, type);
    if (!shouldNotify) return null;

    return prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        priority,
        metadata,
      },
    });
  }

  static async createUniqueNotification({
    userId,
    title,
    message,
    type,
    priority = 'MEDIUM',
    metadata = {},
    notificationKey,
  }) {
    const key = notificationKey ?? metadata.notificationKey;
    if (!key) {
      return this.createNotification({ userId, title, message, type, priority, metadata });
    }

    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type,
        metadata: {
          path: ['notificationKey'],
          equals: key,
        },
      },
      select: { id: true },
    });

    if (existing) return null;

    return this.createNotification({
      userId,
      title,
      message,
      type,
      priority,
      metadata: { ...metadata, notificationKey: key },
    });
  }

  /**
   * Retrieves notifications for a user, ordered by creation date descending.
   * Pagination is supported.
   */
  static buildWhere(userId, filters = {}) {
    return {
      userId,
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.isRead === true || filters.isRead === false ? { isRead: filters.isRead } : {}),
      ...(filters.search ? {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { message: { contains: filters.search, mode: 'insensitive' } },
        ],
      } : {}),
    };
  }

  static async getNotifications(userId, skip = 0, take = 50, filters = {}) {
    const where = this.buildWhere(userId, filters);
    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return { total, notifications };
  }

  /**
   * Retrieves all unread notifications for a user.
   */
  static async getUnreadNotifications(userId) {
    return prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getStats(userId) {
    const [total, unread, latest, byType] = await Promise.all([
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: { _all: true },
      }),
    ]);

    return {
      total,
      unread,
      read: Math.max(total - unread, 0),
      categories: byType.map((item) => ({
        type: item.type,
        count: item._count._all,
      })),
      latest,
    };
  }

  /**
   * Marks a specific notification as read.
   */
  static async markAsRead(userId, notificationId) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) return null;
    if (notification.isRead) return notification;

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Marks all unread notifications as read for a user.
   */
  static async markAllAsRead(userId) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return result.count;
  }
}
