import { AuditLogService } from '#services/audit-log.service.js';
import { ApiResponse } from '#utils/apiResponse.js';

export class AuditLogController {
  static async listAuditLogs(req, res) {
    const { page, limit, ...filters } = req.query ?? {};
    const result = await AuditLogService.findMany({
      filters,
      pagination: { page, limit },
    });

    return ApiResponse.paginated(res, result.auditLogs, result.meta);
  }
}
