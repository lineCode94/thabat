import { Router } from 'express';

import { PERMISSIONS } from '#constants/permissionRegistry.js';
import {
  MENTOR_ASSIGNMENT_VIEW_PERMISSIONS,
  MentorAssignmentController,
} from '#controllers/mentor-assignment.controller.js';
import { asyncHandler } from '#helpers/asyncHandler.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { requireAnyPermission, requirePermission } from '#middlewares/permission.middleware.js';
import { validateRequest } from '#middlewares/validateRequest.js';
import {
  createMentorAssignmentSchema,
  listMentorAssignmentsSchema,
  mentorAssignmentParamsSchema,
  transferMentorAssignmentSchema,
} from '#validators/mentor-assignment.validator.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requireAnyPermission(...MENTOR_ASSIGNMENT_VIEW_PERMISSIONS),
  validateRequest(listMentorAssignmentsSchema),
  asyncHandler(MentorAssignmentController.listAssignments),
);

router.post(
  '/',
  requirePermission(PERMISSIONS.USERS_ASSIGN),
  validateRequest(createMentorAssignmentSchema),
  asyncHandler(MentorAssignmentController.createAssignment),
);

router.post(
  '/:id/deactivate',
  requirePermission(PERMISSIONS.USERS_ASSIGN),
  validateRequest(mentorAssignmentParamsSchema),
  asyncHandler(MentorAssignmentController.deactivateAssignment),
);

router.post(
  '/:userId/transfer',
  requirePermission(PERMISSIONS.USERS_TRANSFER_MENTOR),
  validateRequest(transferMentorAssignmentSchema),
  asyncHandler(MentorAssignmentController.transferAssignment),
);

export default router;
