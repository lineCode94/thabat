import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { AuthorizationService } from '#services/authorization.service.js';
import { MissionService } from '#services/mission.service.js';
import { ApiError } from '#utils/apiError.js';
import { ApiResponse } from '#utils/apiResponse.js';

export const MISSION_READ_PERMISSIONS = [
  PERMISSIONS.MISSIONS_VIEW_OWN,
  PERMISSIONS.MISSIONS_ASSIGN,
  PERMISSIONS.MISSIONS_MANAGE_REGION,
  PERMISSIONS.MISSIONS_MANAGE_ALL,
];

export const MISSION_MANAGE_PERMISSIONS = [
  PERMISSIONS.MISSIONS_MANAGE_REGION,
  PERMISSIONS.MISSIONS_MANAGE_ALL,
];

export const MISSION_ASSIGN_PERMISSIONS = [
  PERMISSIONS.MISSIONS_ASSIGN,
  PERMISSIONS.MISSIONS_MANAGE_REGION,
  PERMISSIONS.MISSIONS_MANAGE_ALL,
];

function hasPermission(req, permission) {
  return AuthorizationService.hasPermission(req, permission);
}

function canManageAllMissions(req) {
  return hasPermission(req, PERMISSIONS.MISSIONS_MANAGE_ALL);
}

function canManageRegionMissions(req) {
  return hasPermission(req, PERMISSIONS.MISSIONS_MANAGE_REGION);
}

function canAssignMissions(req) {
  return hasPermission(req, PERMISSIONS.MISSIONS_ASSIGN);
}

function shouldIncludeCatalog(req) {
  if (req.query?.mine === 'true') return false;

  return AuthorizationService.hasAnyPermission(req, [
    PERMISSIONS.MISSIONS_MANAGE_ALL,
    PERMISSIONS.MISSIONS_MANAGE_REGION,
    PERMISSIONS.MISSIONS_ASSIGN,
  ]);
}

async function assertCanAssignToUser(req, targetUserId) {
  const targetUser = await MissionService.findAssignableUser(targetUserId);

  if (!targetUser) {
    throw ApiError.notFound('User not found');
  }

  if (canManageAllMissions(req)) {
    return targetUser;
  }

  if (canManageRegionMissions(req)) {
    if (targetUser.regionId !== req.user.regionId) {
      throw ApiError.forbidden('Region admins can only assign missions inside their own region');
    }

    return targetUser;
  }

  if (canAssignMissions(req)) {
    const isAssigned = await AuthorizationService.isAssignedUser(req.user.id, targetUserId);
    if (!isAssigned) {
      throw ApiError.forbidden('Mentors can only assign missions to their assigned users');
    }

    return targetUser;
  }

  throw ApiError.forbidden('Insufficient permissions');
}

function resolveAssignableUsersScope(req) {
  if (canManageAllMissions(req)) {
    return {};
  }

  if (canManageRegionMissions(req)) {
    return { regionId: req.user.regionId };
  }

  if (canAssignMissions(req)) {
    return { assignedToMentorId: req.user.id };
  }

  throw ApiError.forbidden('Insufficient permissions');
}

export class MissionController {
  static async getSummary(req, res) {
    const summary = await MissionService.getSummary(req.user.id, req.user.timezone);

    return ApiResponse.success(res, summary);
  }

  static async listAssignableUsers(req, res) {
    const users = await MissionService.findAssignableUsers({
      search: req.query?.search ?? '',
      limit: req.query?.limit ?? 8,
      scope: resolveAssignableUsersScope(req),
    });

    return ApiResponse.success(res, users);
  }

  static async listMissions(req, res) {
    const { page, limit, ...filters } = req.query ?? {};
    const result = await MissionService.findMany({
      viewerUserId: req.user.id,
      includeCatalog: shouldIncludeCatalog(req),
      filters,
      pagination: { page, limit },
    });

    return ApiResponse.paginated(res, result.missions, result.meta);
  }

  static async getMissionById(req, res) {
    const mission = await MissionService.findById(req.params.id);

    return ApiResponse.success(res, mission);
  }

  static async createMission(req, res) {
    const mission = await MissionService.create(req.body, { actorId: req.user.id });

    return ApiResponse.created(res, mission, 'Mission created');
  }

  static async updateMission(req, res) {
    const mission = await MissionService.update(req.params.id, req.body, { actorId: req.user.id });

    return ApiResponse.success(res, mission, { message: 'Mission updated' });
  }

  static async deleteMission(req, res) {
    const mission = await MissionService.softDelete(req.params.id, { actorId: req.user.id });

    return ApiResponse.success(res, mission, { message: 'Mission deactivated' });
  }

  static async assignMission(req, res) {
    await assertCanAssignToUser(req, req.body.userId);
    const userMission = await MissionService.assign(req.params.id, req.body.userId, { actorId: req.user.id });

    return ApiResponse.created(res, userMission, 'Mission assigned');
  }

  static async completeMission(req, res) {
    const result = await MissionService.complete(req.params.id, req.user.id);

    return ApiResponse.success(res, result, { message: 'Mission completed' });
  }
}
