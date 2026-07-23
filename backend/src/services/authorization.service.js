import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { prisma } from '#lib/prisma.js';

export class AuthorizationService {
  static hasPermission(userOrRequest, permission) {
    const permissions = userOrRequest?.permissions ?? userOrRequest?.effectivePermissions ?? [];
    return permissions.includes(permission);
  }

  static hasAnyPermission(userOrRequest, permissions) {
    return permissions.some((permission) => this.hasPermission(userOrRequest, permission));
  }

  static canManageAll(userOrRequest) {
    return this.hasAnyPermission(userOrRequest, [
      PERMISSIONS.USERS_MANAGE_ALL,
      PERMISSIONS.TRACKING_MANAGE_ALL,
      PERMISSIONS.REPORTS_VIEW_ALL,
    ]);
  }

  static canViewInactiveWorship(userOrRequest) {
    return this.hasAnyPermission(userOrRequest, [
      PERMISSIONS.WORSHIP_CATEGORIES_MANAGE,
      PERMISSIONS.WORSHIP_ITEMS_MANAGE,
    ]);
  }

  static canManageRegions(userOrRequest) {
    return this.hasPermission(userOrRequest, PERMISSIONS.REGIONS_MANAGE);
  }

  static canManageAllUsers(userOrRequest) {
    return this.hasPermission(userOrRequest, PERMISSIONS.USERS_MANAGE_ALL);
  }

  static canManageRegionUsers(userOrRequest) {
    return this.hasPermission(userOrRequest, PERMISSIONS.USERS_MANAGE_REGION);
  }

  static canAssignRegionAdmins(userOrRequest) {
    return this.hasPermission(userOrRequest, PERMISSIONS.REGION_ADMINS_ASSIGN);
  }

  static isSelf(user, resourceUserId) {
    return Boolean(user?.id && resourceUserId && user.id === resourceUserId);
  }

  static isSameRegion(user, resourceRegionId) {
    return Boolean(user?.regionId && resourceRegionId && user.regionId === resourceRegionId);
  }

  static async isAssignedUser(mentorId, userId) {
    if (!mentorId || !userId) return false;

    const assignment = await prisma.mentorAssignment.findFirst({
      where: {
        mentorId,
        userId,
        isActive: true,
      },
      select: { id: true },
    });

    return Boolean(assignment);
  }
}
