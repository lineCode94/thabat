import { Router } from 'express';

import {
  MENTOR_ASSIGNMENT_VIEW_PERMISSIONS,
  MENTOR_USERS_VIEW_PERMISSIONS,
  MentorAssignmentController,
} from '#controllers/mentor-assignment.controller.js';
import { asyncHandler } from '#helpers/asyncHandler.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { requireAnyPermission } from '#middlewares/permission.middleware.js';
import { validateRequest } from '#middlewares/validateRequest.js';
import {
  listMentorsSchema,
  mentorUsersParamsSchema,
} from '#validators/mentor-assignment.validator.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requireAnyPermission(...MENTOR_ASSIGNMENT_VIEW_PERMISSIONS),
  validateRequest(listMentorsSchema),
  asyncHandler(MentorAssignmentController.listMentors),
);

router.get(
  '/:mentorId/users',
  requireAnyPermission(...MENTOR_USERS_VIEW_PERMISSIONS),
  validateRequest(mentorUsersParamsSchema),
  asyncHandler(MentorAssignmentController.listMentorUsers),
);

export default router;
