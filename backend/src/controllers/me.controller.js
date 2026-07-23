import { AchievementEngine } from '#services/achievement.engine.js';
import { BadgeEngine } from '#services/badge.engine.js';
import { LevelService } from '#services/level.service.js';
import { NotificationPreferenceService } from '#services/notification-preference.service.js';
import { NotificationService } from '#services/notification.service.js';
import { StreakService } from '#services/streak.service.js';
import { ApiError } from '#utils/apiError.js';
import { ApiResponse } from '#utils/apiResponse.js';
import { catchAsync } from '#utils/catchAsync.js';

export const getPermissions = catchAsync(async (req, res) => {
  return ApiResponse.success(res, {
    permissions: req.permissions ?? [],
  });
});

export const getLevel = catchAsync(async (req, res) => {
  const levelInfo = await LevelService.getUserLevelInfo(req.user.id);

  return ApiResponse.success(res, levelInfo);
});

export const getStreak = catchAsync(async (req, res) => {
  const streakInfo = await StreakService.getStreakInfo(
    req.user.id,
    req.user.timezone || 'Africa/Cairo',
  );

  return ApiResponse.success(res, streakInfo);
});

export const getAchievements = catchAsync(async (req, res) => {
  const achievements = await AchievementEngine.getUserAchievements(
    req.user.id,
    req.user.timezone || 'Africa/Cairo',
  );

  return ApiResponse.success(res, achievements);
});

export const getAchievementById = catchAsync(async (req, res) => {
  const achievement = await AchievementEngine.getUserAchievementByKey(
    req.user.id,
    req.params.key,
    req.user.timezone || 'Africa/Cairo',
  );

  if (!achievement) {
    throw ApiError.notFound('Achievement not found');
  }

  return ApiResponse.success(res, achievement);
});

export const getAchievementsProgress = catchAsync(async (req, res) => {
  const progress = await AchievementEngine.getUserAchievementsProgress(
    req.user.id,
    req.user.timezone || 'Africa/Cairo',
  );

  return ApiResponse.success(res, progress);
});

export const getRecentAchievements = catchAsync(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 3;
  const recent = await AchievementEngine.getRecentAchievements(req.user.id, limit);

  return ApiResponse.success(res, recent);
});

// ---------------------------------------------------------------------------
// Badge handlers
// ---------------------------------------------------------------------------

export const getBadges = catchAsync(async (req, res) => {
  const badges = await BadgeEngine.getUserBadges(req.user.id);

  return ApiResponse.success(res, badges);
});

export const getBadgeById = catchAsync(async (req, res) => {
  const badge = await BadgeEngine.getUserBadgeByKey(req.user.id, req.params.key);

  if (!badge) {
    throw ApiError.notFound('Badge not found');
  }

  return ApiResponse.success(res, badge);
});

export const getRecentBadges = catchAsync(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 3;
  const recent = await BadgeEngine.getRecentBadges(req.user.id, limit);

  return ApiResponse.success(res, recent);
});

// ---------------------------------------------------------------------------
// Notification handlers
// ---------------------------------------------------------------------------

export const getNotifications = catchAsync(async (req, res) => {
  const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
  const take = req.query.take ? parseInt(req.query.take, 10) : 50;
  const filters = {
    type: req.query.type,
    search: req.query.search,
    isRead: req.query.isRead === undefined ? undefined : req.query.isRead === 'true',
  };
  
  const result = await NotificationService.getNotifications(req.user.id, skip, take, filters);

  return ApiResponse.success(res, result);
});

export const getNotificationStats = catchAsync(async (req, res) => {
  const stats = await NotificationService.getStats(req.user.id);

  return ApiResponse.success(res, stats);
});

export const getUnreadNotifications = catchAsync(async (req, res) => {
  const notifications = await NotificationService.getUnreadNotifications(req.user.id);

  return ApiResponse.success(res, notifications);
});

export const markNotificationAsRead = catchAsync(async (req, res) => {
  const notification = await NotificationService.markAsRead(req.user.id, req.params.id);

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  return ApiResponse.success(res, notification);
});

export const markAllNotificationsAsRead = catchAsync(async (req, res) => {
  const count = await NotificationService.markAllAsRead(req.user.id);

  return ApiResponse.success(res, { count }, { message: `${count} notifications marked as read` });
});

// ---------------------------------------------------------------------------
// Notification Preference handlers
// ---------------------------------------------------------------------------

export const getNotificationPreferences = catchAsync(async (req, res) => {
  const prefs = await NotificationPreferenceService.getPreferences(req.user.id);

  return ApiResponse.success(res, prefs);
});

export const updateNotificationPreferences = catchAsync(async (req, res) => {
  const prefs = await NotificationPreferenceService.updatePreferences(req.user.id, req.body);

  return ApiResponse.success(res, prefs, { message: 'Notification preferences updated.' });
});
