import { PermissionService } from '#services/permission.service.js';
import { ApiResponse } from '#utils/apiResponse.js';

export class AdminPermissionController {
  static async list(req, res) {
    const result = await PermissionService.listRolesWithPermissions();
    return ApiResponse.success(res, result);
  }

  static async updateRolePermissions(req, res) {
    const result = await PermissionService.updateRolePermissions(
      req.params.roleId,
      req.body.permissions,
    );

    return ApiResponse.success(res, result, { message: 'Role permissions updated' });
  }
}
