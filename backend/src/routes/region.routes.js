import { Router } from 'express';

import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { REGION_READ_PERMISSIONS, RegionController } from '#controllers/region.controller.js';
import { asyncHandler } from '#helpers/asyncHandler.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { requireAnyPermission, requirePermission } from '#middlewares/permission.middleware.js';
import { validateRequest } from '#middlewares/validateRequest.js';
import {
  createRegionSchema,
  listRegionsSchema,
  regionParamsSchema,
  updateRegionSchema,
} from '#validators/region.validator.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requireAnyPermission(...REGION_READ_PERMISSIONS),
  validateRequest(listRegionsSchema),
  asyncHandler(RegionController.getRegions),
);
router.get(
  '/:id',
  requireAnyPermission(...REGION_READ_PERMISSIONS),
  validateRequest(regionParamsSchema),
  asyncHandler(RegionController.getRegionById),
);
router.post(
  '/',
  requirePermission(PERMISSIONS.REGIONS_MANAGE),
  validateRequest(createRegionSchema),
  asyncHandler(RegionController.createRegion),
);
router.put(
  '/:id',
  requirePermission(PERMISSIONS.REGIONS_MANAGE),
  validateRequest(updateRegionSchema),
  asyncHandler(RegionController.updateRegion),
);
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.REGIONS_MANAGE),
  validateRequest(regionParamsSchema),
  asyncHandler(RegionController.deleteRegion),
);

export default router;
