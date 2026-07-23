import { Router } from 'express';

import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { WeeklyReviewController } from '#controllers/weekly-review.controller.js';
import { asyncHandler } from '#helpers/asyncHandler.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { requireAnyPermission } from '#middlewares/permission.middleware.js';
import { validateRequest } from '#middlewares/validateRequest.js';
import {
  createWeeklyReviewSchema,
  listReviewsSchema,
  reviewIdParamSchema,
  updateWeeklyReviewSchema,
  userCurrentReviewSchema,
} from '#validators/weekly-review.validator.js';

const router = Router();

const manageReviewPermissions = [
  PERMISSIONS.REVIEWS_MANAGE_ASSIGNED,
  PERMISSIONS.REVIEWS_MANAGE_REGION,
  PERMISSIONS.REVIEWS_MANAGE_ALL,
];

const viewReviewPermissions = [
  ...manageReviewPermissions,
  PERMISSIONS.REVIEWS_VIEW_OWN,
];

router.use(authenticate);

router.get(
  '/reviews',
  requireAnyPermission(...viewReviewPermissions),
  validateRequest(listReviewsSchema),
  asyncHandler(WeeklyReviewController.listReviews),
);

router.get(
  '/reviews/:id',
  requireAnyPermission(...viewReviewPermissions),
  validateRequest(reviewIdParamSchema),
  asyncHandler(WeeklyReviewController.getReview),
);

router.get(
  '/users/:userId/weekly-review/current',
  requireAnyPermission(...manageReviewPermissions),
  validateRequest(userCurrentReviewSchema),
  asyncHandler(WeeklyReviewController.getCurrentReviewContext),
);

router.post(
  '/users/:userId/weekly-reviews',
  requireAnyPermission(...manageReviewPermissions),
  validateRequest(createWeeklyReviewSchema),
  asyncHandler(WeeklyReviewController.createCurrentReview),
);

router.patch(
  '/weekly-reviews/:id',
  requireAnyPermission(...manageReviewPermissions),
  validateRequest(updateWeeklyReviewSchema),
  asyncHandler(WeeklyReviewController.updateReview),
);

router.post(
  '/weekly-reviews/:id/complete',
  requireAnyPermission(...manageReviewPermissions),
  validateRequest(reviewIdParamSchema),
  asyncHandler(WeeklyReviewController.completeReview),
);

export default router;
