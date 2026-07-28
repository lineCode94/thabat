import { Router } from 'express';

import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { QuranController } from '#controllers/quran.controller.js';
import { asyncHandler } from '#helpers/asyncHandler.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { requireAnyPermission, requirePermission } from '#middlewares/permission.middleware.js';
import { validateRequest } from '#middlewares/validateRequest.js';
import {
  quranCorrectionSchema,
  quranHistorySchema,
  quranSetupSchema,
  quranTargetUserQuerySchema,
  quranTargetUpdateSchema,
  quranTrackUpdateSchema,
  quranWeeklyLogSchema,
} from '#validators/quran.validator.js';

const router = Router();

router.use(authenticate);

router.get(
  '/progress',
  requireAnyPermission(
    PERMISSIONS.QURAN_MANAGE_SELF,
    PERMISSIONS.QURAN_VIEW_ASSIGNED,
    PERMISSIONS.QURAN_VIEW_REGION,
    PERMISSIONS.QURAN_VIEW_ALL,
  ),
  validateRequest(quranTargetUserQuerySchema),
  asyncHandler(QuranController.getProgress),
);

router.post(
  '/setup',
  requirePermission(PERMISSIONS.QURAN_MANAGE_SELF),
  validateRequest(quranSetupSchema),
  asyncHandler(QuranController.setup),
);

router.post(
  '/weekly-log',
  requirePermission(PERMISSIONS.QURAN_MANAGE_SELF),
  validateRequest(quranWeeklyLogSchema),
  asyncHandler(QuranController.submitWeeklyLog),
);

router.patch(
  '/progress/target',
  requirePermission(PERMISSIONS.QURAN_MANAGE_SELF),
  validateRequest(quranTargetUpdateSchema),
  asyncHandler(QuranController.updateWeeklyTarget),
);

router.patch(
  '/progress/track',
  requirePermission(PERMISSIONS.QURAN_MANAGE_SELF),
  validateRequest(quranTrackUpdateSchema),
  asyncHandler(QuranController.updateTrack),
);

router.get(
  '/weekly-log/history',
  requireAnyPermission(
    PERMISSIONS.QURAN_MANAGE_SELF,
    PERMISSIONS.QURAN_VIEW_ASSIGNED,
    PERMISSIONS.QURAN_VIEW_REGION,
    PERMISSIONS.QURAN_VIEW_ALL,
  ),
  validateRequest(quranHistorySchema),
  asyncHandler(QuranController.getWeeklyLogHistory),
);

router.patch(
  '/weekly-log/:logId/correct',
  requirePermission(PERMISSIONS.QURAN_CORRECT_ALL),
  validateRequest(quranCorrectionSchema),
  asyncHandler(QuranController.correctWeeklyLog),
);

export default router;
