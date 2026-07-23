import { ROLES, PERMISSIONS } from '#constants/permissionRegistry.js';
import { AdminUserService } from '#services/admin-user.service.js';
import { AuthorizationService } from '#services/authorization.service.js';
import { ApiError } from '#utils/apiError.js';
import { ApiResponse } from '#utils/apiResponse.js';

function canManageAllUsers(req) {
  return AuthorizationService.canManageAllUsers(req);
}

function canManageRegionUsers(req) {
  return AuthorizationService.canManageRegionUsers(req);
}

function canAssignRegionAdmins(req) {
  return AuthorizationService.canAssignRegionAdmins(req);
}

function resolveScopeRegionId(req) {
  if (canManageAllUsers(req)) {
    return null;
  }

  if (canManageRegionUsers(req)) {
    return req.user.regionId;
  }

  throw ApiError.forbidden('Insufficient permissions');
}

async function assertRoleAssignmentAllowed(req, roleId) {
  if (!roleId) return null;

  const role = await AdminUserService.getRoleById(roleId);
  const elevatedRoleCodes = [ROLES.REGION_ADMIN, ROLES.SUPER_ADMIN];

  if (elevatedRoleCodes.includes(role.code) && !canAssignRegionAdmins(req)) {
    throw ApiError.forbidden('Assigning region administrator roles requires explicit permission');
  }

  return role;
}

function assertCreateRegionAllowed(req, regionId) {
  if (canManageAllUsers(req)) return;

  if (canManageRegionUsers(req) && regionId !== req.user.regionId) {
    throw ApiError.forbidden('Region admins can only create users in their own region');
  }

  if (!canManageRegionUsers(req)) {
    throw ApiError.forbidden('Insufficient permissions to create users in this region');
  }
}

function assertUpdateRegionAllowed(req, regionId) {
  if (!regionId) return;
  if (canManageAllUsers(req)) return;

  throw ApiError.forbidden('Use the transfer region endpoint to change a user region');
}

export class AdminUserController {
  static async listUsers(req, res) {
    const scopeRegionId = resolveScopeRegionId(req);
    const { page, limit, ...filters } = req.query ?? {};
    const result = await AdminUserService.findMany({
      filters,
      pagination: { page, limit },
      scopeRegionId,
    });

    return ApiResponse.paginated(res, result.users, result.meta);
  }

  static async listAssignableRoles(req, res) {
    const roles = await AdminUserService.findAssignableRoles({
      canAssignElevatedRoles: canAssignRegionAdmins(req),
    });

    return ApiResponse.success(res, roles);
  }

  static async getUserById(req, res) {
    const scopeRegionId = resolveScopeRegionId(req);
    const user = await AdminUserService.findById(req.params.id, { scopeRegionId });

    return ApiResponse.success(res, user);
  }

  static async createUser(req, res) {
    await assertRoleAssignmentAllowed(req, req.body.roleId);
    assertCreateRegionAllowed(req, req.body.regionId);
    const user = await AdminUserService.create(req.body, { actorId: req.user.id });

    return ApiResponse.created(res, user, 'User created');
  }

  static async updateUser(req, res) {
    const scopeRegionId = resolveScopeRegionId(req);
    await assertRoleAssignmentAllowed(req, req.body.roleId);
    assertUpdateRegionAllowed(req, req.body.regionId);
    const user = await AdminUserService.update(req.params.id, req.body, { scopeRegionId, actorId: req.user.id });

    return ApiResponse.success(res, user, { message: 'User updated' });
  }

  static async deactivateUser(req, res) {
    const scopeRegionId = resolveScopeRegionId(req);
    const user = await AdminUserService.setActive(req.params.id, false, { scopeRegionId, actorId: req.user.id });

    return ApiResponse.success(res, user, { message: 'User deactivated' });
  }

  static async reactivateUser(req, res) {
    const scopeRegionId = resolveScopeRegionId(req);
    const user = await AdminUserService.setActive(req.params.id, true, { scopeRegionId, actorId: req.user.id });

    return ApiResponse.success(res, user, { message: 'User reactivated' });
  }

  static async transferRegion(req, res) {
    const user = await AdminUserService.transferRegion(req.params.id, req.body.regionId, { actorId: req.user.id });

    return ApiResponse.success(res, user, { message: 'User transferred to region' });
  }
}

export const ADMIN_USER_MANAGE_PERMISSIONS = [
  PERMISSIONS.USERS_MANAGE_ALL,
  PERMISSIONS.USERS_MANAGE_REGION,
];
