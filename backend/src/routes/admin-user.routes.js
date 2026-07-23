import { Router } from 'express';

import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { ADMIN_USER_MANAGE_PERMISSIONS, AdminUserController } from '#controllers/admin-user.controller.js';
import {
  MENTOR_ASSIGNMENT_VIEW_PERMISSIONS,
  MentorAssignmentController,
} from '#controllers/mentor-assignment.controller.js';
import { asyncHandler } from '#helpers/asyncHandler.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { requireAnyPermission, requirePermission } from '#middlewares/permission.middleware.js';
import { validateRequest } from '#middlewares/validateRequest.js';
import {
  adminUserParamsSchema,
  createAdminUserSchema,
  listAdminUsersSchema,
  transferRegionSchema,
  updateAdminUserSchema,
} from '#validators/admin-user.validator.js';
import { userMentorAssignmentParamsSchema } from '#validators/mentor-assignment.validator.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requireAnyPermission(...ADMIN_USER_MANAGE_PERMISSIONS),
  validateRequest(listAdminUsersSchema),
  asyncHandler(AdminUserController.listUsers),
);
router.get(
  '/:userId/mentor-assignment',
  requireAnyPermission(...MENTOR_ASSIGNMENT_VIEW_PERMISSIONS),
  validateRequest(userMentorAssignmentParamsSchema),
  asyncHandler(MentorAssignmentController.getCurrentAssignmentForUser),
);
router.get(
  '/roles',
  requireAnyPermission(...ADMIN_USER_MANAGE_PERMISSIONS),
  asyncHandler(AdminUserController.listAssignableRoles),
);
router.get(
  '/:id',
  requireAnyPermission(...ADMIN_USER_MANAGE_PERMISSIONS),
  validateRequest(adminUserParamsSchema),
  asyncHandler(AdminUserController.getUserById),
);
router.post(
  '/',
  requirePermission(PERMISSIONS.USERS_CREATE),
  validateRequest(createAdminUserSchema),
  asyncHandler(AdminUserController.createUser),
);
router.put(
  '/:id',
  requireAnyPermission(...ADMIN_USER_MANAGE_PERMISSIONS),
  validateRequest(updateAdminUserSchema),
  asyncHandler(AdminUserController.updateUser),
);
router.patch(
  '/:id/deactivate',
  requireAnyPermission(...ADMIN_USER_MANAGE_PERMISSIONS),
  validateRequest(adminUserParamsSchema),
  asyncHandler(AdminUserController.deactivateUser),
);
router.patch(
  '/:id/reactivate',
  requireAnyPermission(...ADMIN_USER_MANAGE_PERMISSIONS),
  validateRequest(adminUserParamsSchema),
  asyncHandler(AdminUserController.reactivateUser),
);
router.post(
  '/:id/transfer-region',
  requirePermission(PERMISSIONS.USERS_TRANSFER_REGION),
  validateRequest(transferRegionSchema),
  asyncHandler(AdminUserController.transferRegion),
);

export default router;
