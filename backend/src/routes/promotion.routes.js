import { Router } from 'express';

import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { PromotionController } from '#controllers/promotion.controller.js';
import { asyncHandler } from '#helpers/asyncHandler.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { requirePermission } from '#middlewares/permission.middleware.js';
import { validateRequest } from '#middlewares/validateRequest.js';
import {
  createPromotionRecommendationSchema,
  declinePromotionSchema,
  listPromotionsSchema,
  promotionIdSchema,
  userPromotionReadinessSchema,
} from '#validators/promotion.validator.js';

const router = Router();

router.use(authenticate);
router.use(requirePermission(PERMISSIONS.LEVELS_PROMOTE));

router.get(
  '/users/:userId/promotion-readiness',
  validateRequest(userPromotionReadinessSchema),
  asyncHandler(PromotionController.getReadiness),
);

router.post(
  '/users/:userId/promotion-recommendations',
  validateRequest(createPromotionRecommendationSchema),
  asyncHandler(PromotionController.createRecommendation),
);

router.get(
  '/promotions',
  validateRequest(listPromotionsSchema),
  asyncHandler(PromotionController.listPromotions),
);

router.get(
  '/promotions/:id',
  validateRequest(promotionIdSchema),
  asyncHandler(PromotionController.getPromotion),
);

router.post(
  '/promotions/:id/approve',
  validateRequest(promotionIdSchema),
  asyncHandler(PromotionController.approve),
);

router.post(
  '/promotions/:id/decline',
  validateRequest(declinePromotionSchema),
  asyncHandler(PromotionController.decline),
);

export default router;
