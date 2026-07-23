import { PERMISSION_REGISTRY, ROLE_DEFINITIONS, ROLE_PERMISSION_MAP, ROLES } from '#constants/permissionRegistry.js';
import { prisma } from '#lib/prisma.js';

function normalizeRoleCode(roleCode) {
  if (roleCode === 'ADMIN') return ROLES.SUPER_ADMIN;
  return roleCode;
}

export class PermissionService {
  static getRegisteredPermissions() {
    return PERMISSION_REGISTRY;
  }

  static getRolePermissionMap() {
    return ROLE_PERMISSION_MAP;
  }

  static async syncRegistry() {
    const roles = new Map();
    const permissions = new Map();

    for (const role of ROLE_DEFINITIONS) {
      const dbRole = await prisma.role.upsert({
        where: { code: role.code },
        update: {
          name: role.name,
          description: role.description,
          isActive: true,
        },
        create: {
          ...role,
          isActive: true,
        },
      });
      roles.set(role.code, dbRole);
    }

    for (const permission of PERMISSION_REGISTRY) {
      const dbPermission = await prisma.permission.upsert({
        where: { code: permission.code },
        update: {
          name: permission.name,
          description: permission.description,
          module: permission.module,
        },
        create: permission,
      });
      permissions.set(permission.code, dbPermission);
    }

    for (const [roleCode, permissionCodes] of Object.entries(ROLE_PERMISSION_MAP)) {
      const role = roles.get(roleCode);

      for (const permissionCode of permissionCodes) {
        const permission = permissions.get(permissionCode);

        if (!role || !permission) continue;

        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }

    return { roles: roles.size, permissions: permissions.size };
  }

  static async getPermissionsForRole(roleId) {
    if (!roleId) return [];

    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        roleId,
        role: { isActive: true },
      },
      include: {
        permission: true,
      },
    });

    return rolePermissions.map((rolePermission) => rolePermission.permission.code);
  }

  static async getEffectivePermissions(user) {
    if (!user?.roleId) return [];

    const databasePermissions = await this.getPermissionsForRole(user.roleId);
    if (databasePermissions.length > 0) {
      return databasePermissions;
    }

    const roleCode = normalizeRoleCode(user.role?.code);
    return ROLE_PERMISSION_MAP[roleCode] ?? [];
  }
}
