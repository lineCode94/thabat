import { Router } from 'express';

import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { TrackingController } from '#controllers/tracking.controller.js';
import { asyncHandler } from '#helpers/asyncHandler.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { requireAnyPermission } from '#middlewares/permission.middleware.js';
import { validateRequest } from '#middlewares/validateRequest.js';
import {
  createTrackingCustomWorshipItemSchema,
  submitTrackingSchema,
  trackingHistorySchema,
  updateTrackingCustomScheduleSchema,
} from '#validators/tracking.validator.js';

const router = Router();

router.use(authenticate);

router.get('/history', requireAnyPermission(
  PERMISSIONS.TRACKING_MANAGE_SELF,
  PERMISSIONS.TRACKING_REVIEW_ASSIGNED,
  PERMISSIONS.TRACKING_MANAGE_REGION,
  PERMISSIONS.TRACKING_MANAGE_ALL,
), validateRequest(trackingHistorySchema), asyncHandler(TrackingController.getHistory));
router.get('/today', requireAnyPermission(
  PERMISSIONS.TRACKING_MANAGE_SELF,
  PERMISSIONS.TRACKING_REVIEW_ASSIGNED,
  PERMISSIONS.TRACKING_MANAGE_REGION,
  PERMISSIONS.TRACKING_MANAGE_ALL,
), asyncHandler(TrackingController.getToday));
router.get('/custom-schedule', requireAnyPermission(
  PERMISSIONS.TRACKING_MANAGE_SELF,
), asyncHandler(TrackingController.getCustomSchedule));
router.put('/custom-schedule', requireAnyPermission(
  PERMISSIONS.TRACKING_MANAGE_SELF,
), validateRequest(updateTrackingCustomScheduleSchema), asyncHandler(TrackingController.updateCustomSchedule));
router.post('/custom-items', requireAnyPermission(
  PERMISSIONS.TRACKING_MANAGE_SELF,
), validateRequest(createTrackingCustomWorshipItemSchema), asyncHandler(TrackingController.createCustomWorshipItem));
router.post('/today', requireAnyPermission(
  PERMISSIONS.TRACKING_MANAGE_SELF,
  PERMISSIONS.TRACKING_MANAGE_REGION,
  PERMISSIONS.TRACKING_MANAGE_ALL,
), validateRequest(submitTrackingSchema), asyncHandler(TrackingController.submitToday));
router.put('/today', requireAnyPermission(
  PERMISSIONS.TRACKING_MANAGE_SELF,
  PERMISSIONS.TRACKING_MANAGE_REGION,
  PERMISSIONS.TRACKING_MANAGE_ALL,
), validateRequest(submitTrackingSchema), asyncHandler(TrackingController.submitToday));

export default router;
