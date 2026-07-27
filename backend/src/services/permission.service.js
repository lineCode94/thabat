import { PERMISSION_REGISTRY, ROLE_DEFINITIONS, ROLE_PERMISSION_MAP } from '#constants/permissionRegistry.js';
import { prisma } from '#lib/prisma.js';
import { ApiError } from '#utils/apiError.js';

export class PermissionService {
  static getRegisteredPermissions() {
    return PERMISSION_REGISTRY;
  }

  static getRolePermissionMap() {
    return ROLE_PERMISSION_MAP;
  }

  static async syncRegistry({ assignDefaultPermissions = true } = {}) {
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

    if (assignDefaultPermissions) {
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

  static async listRolesWithPermissions() {
    await this.syncRegistry({ assignDefaultPermissions: false });

    const [roles, permissions] = await Promise.all([
      prisma.role.findMany({
        where: { isActive: true },
        include: {
          rolePermissions: {
            include: { permission: true },
          },
          _count: {
            select: { users: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.permission.findMany({
        orderBy: [
          { module: 'asc' },
          { code: 'asc' },
        ],
      }),
    ]);

    return {
      roles: roles.map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        description: role.description,
        userCount: role._count.users,
        permissions: role.rolePermissions
          .map((rolePermission) => rolePermission.permission.code)
          .sort(),
      })),
      permissions,
    };
  }

  static async updateRolePermissions(roleId, permissionCodes = []) {
    await this.syncRegistry({ assignDefaultPermissions: false });

    const uniquePermissionCodes = [...new Set(permissionCodes)];
    const [role, permissions] = await Promise.all([
      prisma.role.findUnique({ where: { id: roleId } }),
      prisma.permission.findMany({
        where: { code: { in: uniquePermissionCodes } },
      }),
    ]);

    if (!role || !role.isActive) {
      throw ApiError.badRequest('Role is not valid');
    }

    if (permissions.length !== uniquePermissionCodes.length) {
      throw ApiError.badRequest('One or more permissions are not valid');
    }

    const permissionIds = permissions.map((permission) => permission.id);

    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: {
          roleId,
          permissionId: { notIn: permissionIds },
        },
      });

      for (const permission of permissions) {
        await tx.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId,
            permissionId: permission.id,
          },
        });
      }
    });

    return this.listRolesWithPermissions();
  }

  static async getEffectivePermissions(user) {
    if (!user?.roleId) return [];

    const databasePermissions = await this.getPermissionsForRole(user.roleId);
    return databasePermissions;

  }
}
