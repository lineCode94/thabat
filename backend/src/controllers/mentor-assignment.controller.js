import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { AuthorizationService } from '#services/authorization.service.js';
import { MentorAssignmentService } from '#services/mentor-assignment.service.js';
import { ApiError } from '#utils/apiError.js';
import { ApiResponse } from '#utils/apiResponse.js';

function resolveScopeRegionId(req) {
  if (AuthorizationService.canManageAllUsers(req)) {
    return null;
  }

  if (AuthorizationService.canManageRegionUsers(req)) {
    return req.user.regionId;
  }

  throw ApiError.forbidden('Insufficient permissions');
}

function resolveOptionalScopeRegionId(req) {
  if (AuthorizationService.canManageAllUsers(req)) {
    return null;
  }

  if (AuthorizationService.canManageRegionUsers(req)) {
    return req.user.regionId;
  }

  return null;
}

function resolveOwnMentorId(req) {
  if (AuthorizationService.canManageAllUsers(req) || AuthorizationService.canManageRegionUsers(req)) {
    return null;
  }

  if (AuthorizationService.hasPermission(req, PERMISSIONS.USERS_VIEW_ASSIGNED)) {
    return req.user.id;
  }

  throw ApiError.forbidden('Insufficient permissions');
}

export class MentorAssignmentController {
  static async listMentors(req, res) {
    const scopeRegionId = resolveScopeRegionId(req);
    const mentors = await MentorAssignmentService.findMentors({
      filters: req.query ?? {},
      scopeRegionId,
    });

    return ApiResponse.success(res, mentors);
  }

  static async listAssignments(req, res) {
    const scopeRegionId = resolveScopeRegionId(req);
    const assignments = await MentorAssignmentService.findMany({
      filters: req.query ?? {},
      scopeRegionId,
    });

    return ApiResponse.success(res, assignments);
  }

  static async getCurrentAssignmentForUser(req, res) {
    const scopeRegionId = resolveScopeRegionId(req);
    const assignment = await MentorAssignmentService.findCurrentForUser(
      req.params.userId,
      { scopeRegionId },
    );

    return ApiResponse.success(res, assignment);
  }

  static async listMentorUsers(req, res) {
    const scopeRegionId = resolveOptionalScopeRegionId(req);
    const ownMentorId = resolveOwnMentorId(req);
    const users = await MentorAssignmentService.findUsersForMentor(
      req.params.mentorId,
      { scopeRegionId, ownMentorId },
    );

    return ApiResponse.success(res, users);
  }

  static async createAssignment(req, res) {
    const scopeRegionId = resolveScopeRegionId(req);
    const assignment = await MentorAssignmentService.assign(req.body, { scopeRegionId, actorId: req.user.id });

    return ApiResponse.created(res, assignment, 'Mentor assignment created');
  }

  static async transferAssignment(req, res) {
    const scopeRegionId = resolveScopeRegionId(req);
    const assignment = await MentorAssignmentService.transfer(
      req.params.userId,
      req.body,
      { scopeRegionId, actorId: req.user.id },
    );

    return ApiResponse.created(res, assignment, 'Mentor assignment transferred');
  }

  static async deactivateAssignment(req, res) {
    const scopeRegionId = resolveScopeRegionId(req);
    const assignment = await MentorAssignmentService.deactivate(
      req.params.id,
      { scopeRegionId, actorId: req.user.id },
    );

    return ApiResponse.success(res, assignment, 'Mentor assignment deactivated');
  }
}

export const MENTOR_ASSIGNMENT_VIEW_PERMISSIONS = [
  PERMISSIONS.USERS_MANAGE_ALL,
  PERMISSIONS.USERS_MANAGE_REGION,
];

export const MENTOR_USERS_VIEW_PERMISSIONS = [
  PERMISSIONS.USERS_MANAGE_ALL,
  PERMISSIONS.USERS_MANAGE_REGION,
  PERMISSIONS.USERS_VIEW_ASSIGNED,
];
