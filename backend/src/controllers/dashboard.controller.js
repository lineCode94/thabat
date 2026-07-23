import { DashboardService } from '#services/dashboard.service.js';
import { ApiResponse } from '#utils/apiResponse.js';

export class DashboardController {
  static async getSummary(req, res) {
    const { id: userId, timezone } = req.user;
    const summary = await DashboardService.getSummary(userId, timezone);
    return ApiResponse.success(res, summary);
  }
}
