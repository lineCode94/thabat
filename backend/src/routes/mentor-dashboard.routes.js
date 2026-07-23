import { Router } from 'express';

import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { MentorDashboardController } from '#controllers/mentor-dashboard.controller.js';
import { asyncHandler } from '#helpers/asyncHandler.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { requireAnyPermission } from '#middlewares/permission.middleware.js';

const router = Router();

router.use(authenticate);

router.get(
  '/dashboard',
  requireAnyPermission(
    PERMISSIONS.REVIEWS_MANAGE_ASSIGNED,
    PERMISSIONS.REVIEWS_MANAGE_REGION,
    PERMISSIONS.REVIEWS_MANAGE_ALL,
  ),
  asyncHandler(MentorDashboardController.getDashboard),
);

export default router;
