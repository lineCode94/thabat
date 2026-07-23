import { TrackingService } from '#services/tracking.service.js';
import { WorshipLevelService } from '#services/worship-level.service.js';
import { ApiResponse } from '#utils/apiResponse.js';

export class TrackingController {
  static async getToday(req, res) {
    const { id: userId, timezone } = req.user;
    const tracking = await TrackingService.getTodayTracking(userId, timezone);
    return ApiResponse.success(res, tracking);
  }

  static async getHistory(req, res) {
    const history = await TrackingService.getHistory(req.user, req.permissions, req.query);
    return ApiResponse.success(res, history);
  }

  static async submitToday(req, res) {
    const { id: userId, timezone } = req.user;
    const { entries } = req.body;
    const tracking = await TrackingService.submitTodayTracking(userId, timezone, entries);
    return ApiResponse.success(res, tracking, { message: 'Tracking updated successfully' });
  }

  static async getCustomSchedule(req, res) {
    const schedule = await WorshipLevelService.getUserCustomSchedule(req.user.id, {
      actor: req.user,
      permissions: req.permissions,
      allowSelf: true,
    });

    return ApiResponse.success(res, schedule);
  }

  static async updateCustomSchedule(req, res) {
    const schedule = await WorshipLevelService.updateUserCustomSchedule(req.user.id, req.body, {
      actor: req.user,
      permissions: req.permissions,
      allowSelf: true,
    });

    return ApiResponse.success(res, schedule, { message: 'Tracking schedule customized' });
  }

  static async createCustomWorshipItem(req, res) {
    const item = await WorshipLevelService.createUserCustomWorshipItem(req.user.id, req.body, {
      actor: req.user,
      permissions: req.permissions,
      allowSelf: true,
    });

    return ApiResponse.created(res, item, 'Custom worship item created');
  }

  static async reopenWeek(req, res) {
    const { weekStartDate } = req.params;
    const { userId } = req.body;
    const result = await TrackingService.reopenWeek(userId, weekStartDate, { actorId: req.user.id });
    return ApiResponse.success(res, result, { message: 'Tracking week reopened successfully' });
  }
}
