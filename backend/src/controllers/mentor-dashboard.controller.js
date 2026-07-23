import { MentorDashboardService } from '#services/mentor-dashboard.service.js';
import { ApiResponse } from '#utils/apiResponse.js';

export class MentorDashboardController {
  static async getDashboard(req, res) {
    const dashboard = await MentorDashboardService.getDashboard(req.user, req.permissions);
    return ApiResponse.success(res, dashboard);
  }
}
