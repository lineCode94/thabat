import { Router } from 'express';

import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { WorshipLevelController } from '#controllers/worship-level.controller.js';
import { asyncHandler } from '#helpers/asyncHandler.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { requireAnyPermission, requirePermission } from '#middlewares/permission.middleware.js';
import { validateRequest } from '#middlewares/validateRequest.js';
import {
  createWorshipLevelSchema,
  assignWorshipLevelSchema,
  listAssignableWorshipLevelUsersSchema,
  updateUserCustomScheduleSchema,
  userCustomScheduleSchema,
  updateWorshipLevelSchema,
  worshipLevelIdSchema,
} from '#validators/worship-level.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', requireAnyPermission(PERMISSIONS.LEVELS_VIEW, PERMISSIONS.LEVELS_MANAGE, PERMISSIONS.LEVELS_PROMOTE), asyncHandler(WorshipLevelController.findMany));
router.get(
  '/assignable-users',
  requireAnyPermission(PERMISSIONS.LEVELS_PROMOTE, PERMISSIONS.LEVELS_MANAGE),
  validateRequest(listAssignableWorshipLevelUsersSchema),
  asyncHandler(WorshipLevelController.listAssignableUsers),
);
router.get(
  '/users/:userId/custom-schedule',
  requireAnyPermission(PERMISSIONS.LEVELS_PROMOTE, PERMISSIONS.LEVELS_MANAGE),
  validateRequest(userCustomScheduleSchema),
  asyncHandler(WorshipLevelController.getUserCustomSchedule),
);
router.put(
  '/users/:userId/custom-schedule',
  requireAnyPermission(PERMISSIONS.LEVELS_PROMOTE, PERMISSIONS.LEVELS_MANAGE),
  validateRequest(updateUserCustomScheduleSchema),
  asyncHandler(WorshipLevelController.updateUserCustomSchedule),
);
router.get('/:id', requireAnyPermission(PERMISSIONS.LEVELS_VIEW, PERMISSIONS.LEVELS_MANAGE), validateRequest(worshipLevelIdSchema), asyncHandler(WorshipLevelController.findById));

router.post('/', requirePermission(PERMISSIONS.LEVELS_MANAGE), validateRequest(createWorshipLevelSchema), asyncHandler(WorshipLevelController.create));
router.put('/:id', requirePermission(PERMISSIONS.LEVELS_MANAGE), validateRequest(updateWorshipLevelSchema), asyncHandler(WorshipLevelController.update));
router.delete('/:id', requirePermission(PERMISSIONS.LEVELS_MANAGE), validateRequest(worshipLevelIdSchema), asyncHandler(WorshipLevelController.deactivate));
router.post(
  '/:id/assign-users',
  requireAnyPermission(PERMISSIONS.LEVELS_PROMOTE, PERMISSIONS.LEVELS_MANAGE),
  validateRequest(assignWorshipLevelSchema),
  asyncHandler(WorshipLevelController.assignUsers),
);

export default router;
