import { Router } from 'express';

import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { ProfileController } from '#controllers/profile.controller.js';
import { asyncHandler } from '#helpers/asyncHandler.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { requireAnyPermission } from '#middlewares/permission.middleware.js';
import { validateRequest } from '#middlewares/validateRequest.js';
import { updateProfileSchema, changePasswordSchema } from '#validators/profile.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', requireAnyPermission(
  PERMISSIONS.USERS_VIEW_SELF,
  PERMISSIONS.USERS_VIEW_ASSIGNED,
  PERMISSIONS.USERS_MANAGE_REGION,
  PERMISSIONS.USERS_MANAGE_ALL,
), asyncHandler(ProfileController.getProfile));
router.put('/', requireAnyPermission(
  PERMISSIONS.PROFILE_UPDATE_OWN,
  PERMISSIONS.SETTINGS_MANAGE_REGION,
  PERMISSIONS.SETTINGS_MANAGE_SYSTEM,
), validateRequest(updateProfileSchema), asyncHandler(ProfileController.updateProfile));
router.put('/password', requireAnyPermission(
  PERMISSIONS.PROFILE_UPDATE_OWN,
  PERMISSIONS.SETTINGS_MANAGE_REGION,
  PERMISSIONS.SETTINGS_MANAGE_SYSTEM,
), validateRequest(changePasswordSchema), asyncHandler(ProfileController.changePassword));

export default router;
