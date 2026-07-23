import { Router } from 'express';

import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { DashboardController } from '#controllers/dashboard.controller.js';
import { asyncHandler } from '#helpers/asyncHandler.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { requirePermission } from '#middlewares/permission.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/summary', requirePermission(PERMISSIONS.DASHBOARD_VIEW), asyncHandler(DashboardController.getSummary));

export default router;
