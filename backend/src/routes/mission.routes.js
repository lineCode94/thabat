import { Router } from 'express';

import { PERMISSIONS } from '#constants/permissionRegistry.js';
import {
  MISSION_ASSIGN_PERMISSIONS,
  MISSION_MANAGE_PERMISSIONS,
  MISSION_READ_PERMISSIONS,
  MissionController,
} from '#controllers/mission.controller.js';
import { asyncHandler } from '#helpers/asyncHandler.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { requireAnyPermission, requirePermission } from '#middlewares/permission.middleware.js';
import { validateRequest } from '#middlewares/validateRequest.js';
import {
  assignMissionSchema,
  assignableMissionUsersSchema,
  createMissionSchema,
  listMissionsSchema,
  missionParamsSchema,
  updateMissionSchema,
} from '#validators/mission.validator.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requireAnyPermission(...MISSION_READ_PERMISSIONS),
  validateRequest(listMissionsSchema),
  asyncHandler(MissionController.listMissions),
);

router.get(
  '/assignable-users',
  requireAnyPermission(...MISSION_ASSIGN_PERMISSIONS),
  validateRequest(assignableMissionUsersSchema),
  asyncHandler(MissionController.listAssignableUsers),
);

router.get(
  '/summary',
  requirePermission(PERMISSIONS.MISSIONS_VIEW_OWN),
  asyncHandler(MissionController.getSummary),
);

router.get(
  '/:id',
  requireAnyPermission(...MISSION_READ_PERMISSIONS),
  validateRequest(missionParamsSchema),
  asyncHandler(MissionController.getMissionById),
);

router.post(
  '/',
  requireAnyPermission(...MISSION_MANAGE_PERMISSIONS),
  validateRequest(createMissionSchema),
  asyncHandler(MissionController.createMission),
);

router.put(
  '/:id',
  requireAnyPermission(...MISSION_MANAGE_PERMISSIONS),
  validateRequest(updateMissionSchema),
  asyncHandler(MissionController.updateMission),
);

router.delete(
  '/:id',
  requireAnyPermission(...MISSION_MANAGE_PERMISSIONS),
  validateRequest(missionParamsSchema),
  asyncHandler(MissionController.deleteMission),
);

router.post(
  '/:id/assign',
  requireAnyPermission(...MISSION_ASSIGN_PERMISSIONS),
  validateRequest(assignMissionSchema),
  asyncHandler(MissionController.assignMission),
);

router.post(
  '/:id/complete',
  requirePermission(PERMISSIONS.MISSIONS_VIEW_OWN),
  validateRequest(missionParamsSchema),
  asyncHandler(MissionController.completeMission),
);

export default router;
