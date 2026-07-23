import { ReportSummaryService } from '#services/report-summary.service.js';
import { WeeklyReportService } from '#services/weekly-report.service.js';
import { ApiResponse } from '#utils/apiResponse.js';

export class ReportController {
  static async getDailyReport(req, res) {
    const report = await ReportSummaryService.getDailyReport(req.user, req.permissions, req.query);
    return ApiResponse.success(res, report);
  }

  static async getWeeklyReport(req, res) {
    const result = await WeeklyReportService.getWeeklyReport(req.user, req.permissions, req.query);
    return ApiResponse.success(res, result.report, {
      message: result.generated ? 'Weekly report generated' : 'Weekly report retrieved',
    });
  }

  static async getMonthlyReport(req, res) {
    const report = await ReportSummaryService.getMonthlyReport(req.user, req.permissions, req.query);
    return ApiResponse.success(res, report);
  }
}
