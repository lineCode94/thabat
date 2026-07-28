import { QuranService } from '#services/quran.service.js';
import { ApiResponse } from '#utils/apiResponse.js';

export class QuranController {
  static async getProgress(req, res) {
    const result = await QuranService.getProgress(req.user, req.permissions, req.query);
    return ApiResponse.success(res, result);
  }

  static async setup(req, res) {
    const result = await QuranService.setup(req.user, req.permissions, req.body);
    return ApiResponse.created(res, result, 'Quran progress configured');
  }

  static async submitWeeklyLog(req, res) {
    const result = await QuranService.submitWeeklyLog(req.user, req.permissions, req.body);
    return ApiResponse.success(res, result, { message: 'Quran weekly log submitted' });
  }

  static async updateWeeklyTarget(req, res) {
    const result = await QuranService.updateWeeklyTarget(req.user, req.permissions, req.body);
    return ApiResponse.success(res, result, { message: 'Quran weekly target updated' });
  }

  static async updateTrack(req, res) {
    const result = await QuranService.updateTrack(req.user, req.permissions, req.body);
    return ApiResponse.success(res, result, { message: 'Quran track updated' });
  }

  static async getWeeklyLogHistory(req, res) {
    const result = await QuranService.getHistory(req.user, req.permissions, req.query);
    return ApiResponse.success(res, {
      user: result.user,
      logs: result.logs,
    }, {
      meta: { pagination: result.meta },
    });
  }

  static async correctWeeklyLog(req, res) {
    const result = await QuranService.correctWeeklyLog(req.user, req.body, req.params.logId);
    return ApiResponse.success(res, result, { message: 'Quran weekly log corrected' });
  }
}
