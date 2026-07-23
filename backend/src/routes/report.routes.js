import { Router } from 'express';

import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { ReportController } from '#controllers/report.controller.js';
import { asyncHandler } from '#helpers/asyncHandler.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { requireAnyPermission } from '#middlewares/permission.middleware.js';
import { validateRequest } from '#middlewares/validateRequest.js';
import { dailyReportSchema, monthlyReportSchema, weeklyReportSchema } from '#validators/report.validator.js';

const router = Router();

router.use(authenticate);

router.get(
  '/daily',
  requireAnyPermission(
    PERMISSIONS.REPORTS_VIEW_OWN,
    PERMISSIONS.REPORTS_VIEW_ASSIGNED,
    PERMISSIONS.REPORTS_VIEW_REGION,
    PERMISSIONS.REPORTS_VIEW_ALL,
  ),
  validateRequest(dailyReportSchema),
  asyncHandler(ReportController.getDailyReport),
);

router.get(
  '/weekly',
  requireAnyPermission(
    PERMISSIONS.REPORTS_VIEW_OWN,
    PERMISSIONS.REPORTS_VIEW_ASSIGNED,
    PERMISSIONS.REPORTS_VIEW_REGION,
    PERMISSIONS.REPORTS_VIEW_ALL,
  ),
  validateRequest(weeklyReportSchema),
  asyncHandler(ReportController.getWeeklyReport),
);

router.get(
  '/monthly',
  requireAnyPermission(
    PERMISSIONS.REPORTS_VIEW_OWN,
    PERMISSIONS.REPORTS_VIEW_ASSIGNED,
    PERMISSIONS.REPORTS_VIEW_REGION,
    PERMISSIONS.REPORTS_VIEW_ALL,
  ),
  validateRequest(monthlyReportSchema),
  asyncHandler(ReportController.getMonthlyReport),
);

export default router;
