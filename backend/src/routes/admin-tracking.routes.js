import { Router } from 'express';

import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { TrackingController } from '#controllers/tracking.controller.js';
import { asyncHandler } from '#helpers/asyncHandler.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { requirePermission } from '#middlewares/permission.middleware.js';
import { validateRequest } from '#middlewares/validateRequest.js';
import { reopenTrackingWeekSchema } from '#validators/tracking.validator.js';

const router = Router();

router.use(authenticate);

router.post(
  '/weeks/:weekStartDate/reopen',
  requirePermission(PERMISSIONS.TRACKING_MANAGE_ALL),
  validateRequest(reopenTrackingWeekSchema),
  asyncHandler(TrackingController.reopenWeek),
);

export default router;
