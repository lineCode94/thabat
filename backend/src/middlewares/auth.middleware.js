import { ROLES } from '#constants/permissionRegistry.js';
import { verifyToken } from '#lib/jwt.js';
import { prisma } from '#lib/prisma.js';
import { PermissionService } from '#services/permission.service.js';
import { ApiError } from '#utils/apiError.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(ApiError.unauthorized('Missing or invalid token'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return next(ApiError.unauthorized('Invalid or expired token'));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user || !user.isActive || user.deletedAt) {
      return next(ApiError.unauthorized('User not found or inactive'));
    }

    if (user.role?.code === 'ADMIN') {
      const superAdminRole = await prisma.role.findUnique({
        where: { code: ROLES.SUPER_ADMIN },
        select: { id: true, code: true, name: true, description: true, isActive: true },
      });

      if (superAdminRole) {
        await prisma.user.update({
          where: { id: user.id },
          data: { roleId: superAdminRole.id },
        });
        user.roleId = superAdminRole.id;
        user.role = superAdminRole;
      }
    }

    req.user = user;
    req.permissions = await PermissionService.getEffectivePermissions(user);
    req.hasPermission = (permission) => req.permissions.includes(permission);
    next();
  } catch (error) {
    next(error);
  }
};
