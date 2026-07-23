import { PermissionService } from '#services/permission.service.js';
import { ApiError } from '#utils/apiError.js';

export const resolvePermissions = async (req, _res, next) => {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    req.permissions = await PermissionService.getEffectivePermissions(req.user);
    req.hasPermission = (permission) => req.permissions.includes(permission);

    return next();
  } catch (error) {
    return next(error);
  }
};

export const requirePermission = (permission) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!req.permissions?.includes(permission)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }

    return next();
  };
};

export const requireAnyPermission = (...permissions) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!permissions.some((permission) => req.permissions?.includes(permission))) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }

    return next();
  };
};
