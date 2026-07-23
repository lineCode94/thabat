import { Router } from 'express';

import { PERMISSIONS } from '#constants/permissionRegistry.js';
import {
  getAchievementById,
  getAchievements,
  getAchievementsProgress,
  getBadgeById,
  getBadges,
  getLevel,
  getRecentAchievements,
  getRecentBadges,
  getStreak,
  getNotifications,
  getNotificationStats,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
  getPermissions,
} from '#controllers/me.controller.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { requireAnyPermission, requirePermission } from '#middlewares/permission.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/level', requirePermission(PERMISSIONS.LEVELS_VIEW), getLevel);
router.get('/streak', requirePermission(PERMISSIONS.DASHBOARD_VIEW), getStreak);
router.get('/permissions', getPermissions);

router.get('/achievements', requirePermission(PERMISSIONS.ACHIEVEMENTS_VIEW), getAchievements);
router.get('/achievements/progress', requirePermission(PERMISSIONS.ACHIEVEMENTS_VIEW), getAchievementsProgress);
router.get('/achievements/recent', requirePermission(PERMISSIONS.ACHIEVEMENTS_VIEW), getRecentAchievements);
router.get('/achievements/:key', requirePermission(PERMISSIONS.ACHIEVEMENTS_VIEW), getAchievementById);

router.get('/badges', requirePermission(PERMISSIONS.BADGES_VIEW), getBadges);
router.get('/badges/recent', requirePermission(PERMISSIONS.BADGES_VIEW), getRecentBadges);
router.get('/badges/:key', requirePermission(PERMISSIONS.BADGES_VIEW), getBadgeById);

router.get('/notifications', requireAnyPermission(
  PERMISSIONS.NOTIFICATIONS_VIEW_OWN,
  PERMISSIONS.NOTIFICATIONS_VIEW_ASSIGNED,
  PERMISSIONS.NOTIFICATIONS_MANAGE_REGION,
  PERMISSIONS.NOTIFICATIONS_MANAGE_ALL,
), getNotifications);
router.get('/notifications/unread', requireAnyPermission(
  PERMISSIONS.NOTIFICATIONS_VIEW_OWN,
  PERMISSIONS.NOTIFICATIONS_VIEW_ASSIGNED,
  PERMISSIONS.NOTIFICATIONS_MANAGE_REGION,
  PERMISSIONS.NOTIFICATIONS_MANAGE_ALL,
), getUnreadNotifications);
router.get('/notifications/stats', requireAnyPermission(
  PERMISSIONS.NOTIFICATIONS_VIEW_OWN,
  PERMISSIONS.NOTIFICATIONS_VIEW_ASSIGNED,
  PERMISSIONS.NOTIFICATIONS_MANAGE_REGION,
  PERMISSIONS.NOTIFICATIONS_MANAGE_ALL,
), getNotificationStats);
router.patch('/notifications/read-all', requireAnyPermission(
  PERMISSIONS.NOTIFICATIONS_VIEW_OWN,
  PERMISSIONS.NOTIFICATIONS_VIEW_ASSIGNED,
  PERMISSIONS.NOTIFICATIONS_MANAGE_REGION,
  PERMISSIONS.NOTIFICATIONS_MANAGE_ALL,
), markAllNotificationsAsRead);
router.patch('/notifications/:id/read', requireAnyPermission(
  PERMISSIONS.NOTIFICATIONS_VIEW_OWN,
  PERMISSIONS.NOTIFICATIONS_VIEW_ASSIGNED,
  PERMISSIONS.NOTIFICATIONS_MANAGE_REGION,
  PERMISSIONS.NOTIFICATIONS_MANAGE_ALL,
), markNotificationAsRead);

router.get('/notification-preferences', requireAnyPermission(
  PERMISSIONS.SETTINGS_MANAGE_PROFILE,
  PERMISSIONS.SETTINGS_MANAGE_REGION,
  PERMISSIONS.SETTINGS_MANAGE_SYSTEM,
), getNotificationPreferences);
router.put('/notification-preferences', requireAnyPermission(
  PERMISSIONS.SETTINGS_MANAGE_PROFILE,
  PERMISSIONS.SETTINGS_MANAGE_REGION,
  PERMISSIONS.SETTINGS_MANAGE_SYSTEM,
), updateNotificationPreferences);

export default router;
