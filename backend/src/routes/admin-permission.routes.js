import { Router } from 'express';

import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { AdminPermissionController } from '#controllers/admin-permission.controller.js';
import { asyncHandler } from '#helpers/asyncHandler.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { requirePermission } from '#middlewares/permission.middleware.js';
import { validateRequest } from '#middlewares/validateRequest.js';
import {
  rolePermissionParamsSchema,
  updateRolePermissionsSchema,
} from '#validators/admin-permission.validator.js';

const router = Router();

router.use(authenticate);
router.use(requirePermission(PERMISSIONS.SETTINGS_MANAGE_SYSTEM));

router.get('/', asyncHandler(AdminPermissionController.list));
router.put(
  '/roles/:roleId',
  validateRequest(updateRolePermissionsSchema),
  asyncHandler(AdminPermissionController.updateRolePermissions),
);
router.get(
  '/roles/:roleId',
  validateRequest(rolePermissionParamsSchema),
  asyncHandler(AdminPermissionController.list),
);

export default router;
