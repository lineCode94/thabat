import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { AuthorizationService } from '#services/authorization.service.js';

export async function canAccessUserResource(req, resourceUserId, resourceRegionId = null) {
  if (req.hasPermission?.(PERMISSIONS.USERS_MANAGE_ALL)) return true;

  if (
    resourceRegionId &&
    req.hasPermission?.(PERMISSIONS.USERS_MANAGE_REGION) &&
    AuthorizationService.isSameRegion(req.user, resourceRegionId)
  ) {
    return true;
  }

  if (
    req.hasPermission?.(PERMISSIONS.USERS_VIEW_ASSIGNED) &&
    await AuthorizationService.isAssignedUser(req.user.id, resourceUserId)
  ) {
    return true;
  }

  return req.hasPermission?.(PERMISSIONS.USERS_VIEW_SELF) &&
    AuthorizationService.isSelf(req.user, resourceUserId);
}
