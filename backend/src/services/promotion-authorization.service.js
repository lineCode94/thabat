import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { prisma } from '#lib/prisma.js';
import { AuthorizationService } from '#services/authorization.service.js';
import { ApiError } from '#utils/apiError.js';

export class PromotionAuthorizationService {
  static _permissionBag(actor, permissions) {
    return { ...actor, permissions };
  }

  static async getTargetUser(userId) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null, isActive: true },
      select: { id: true, fullName: true, email: true, regionId: true, timezone: true },
    });

    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  static async assertCanPromoteUser(actor, permissions, userId) {
    const permissionBag = this._permissionBag(actor, permissions);
    if (!AuthorizationService.hasPermission(permissionBag, PERMISSIONS.LEVELS_PROMOTE)) {
      throw ApiError.forbidden('Insufficient permissions');
    }

    const targetUser = await this.getTargetUser(userId);

    if (AuthorizationService.hasPermission(permissionBag, PERMISSIONS.USERS_MANAGE_ALL)) {
      return targetUser;
    }

    if (
      AuthorizationService.hasPermission(permissionBag, PERMISSIONS.USERS_MANAGE_REGION) &&
      AuthorizationService.isSameRegion(actor, targetUser.regionId)
    ) {
      return targetUser;
    }

    if (
      AuthorizationService.hasPermission(permissionBag, PERMISSIONS.USERS_VIEW_ASSIGNED) &&
      await AuthorizationService.isAssignedUser(actor.id, targetUser.id)
    ) {
      return targetUser;
    }

    throw ApiError.forbidden('You are not allowed to manage promotion for this user');
  }

  static scopedPromotionWhere(actor, permissions) {
    const permissionBag = this._permissionBag(actor, permissions);

    if (AuthorizationService.hasPermission(permissionBag, PERMISSIONS.USERS_MANAGE_ALL)) {
      return {};
    }

    if (AuthorizationService.hasPermission(permissionBag, PERMISSIONS.USERS_MANAGE_REGION)) {
      return { user: { regionId: actor.regionId } };
    }

    if (AuthorizationService.hasPermission(permissionBag, PERMISSIONS.USERS_VIEW_ASSIGNED)) {
      return {
        user: {
          mentorAssignmentsAsStudent: {
            some: { mentorId: actor.id, isActive: true },
          },
        },
      };
    }

    throw ApiError.forbidden('Insufficient permissions');
  }
}
