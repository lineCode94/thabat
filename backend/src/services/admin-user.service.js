import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '#constants/auditLog.js';
import { PAGINATION } from '#constants/index.js';
import { ONBOARDING_STATUS } from '#constants/onboarding.js';
import { ROLES } from '#constants/permissionRegistry.js';
import { hashPassword } from '#lib/hash.js';
import { prisma } from '#lib/prisma.js';
import { UserRepository } from '#repositories/user.repository.js';
import { AuditLogService, buildChangedFieldsDiff } from '#services/audit-log.service.js';
import { OnboardingService } from '#services/onboarding.service.js';
import { ApiError } from '#utils/apiError.js';

const ADMIN_USER_INCLUDE = {
  role: true,
  region: true,
  userLevels: {
    where: { isActive: true },
    include: { worshipLevel: true },
  },
  mentorAssignmentsAsStudent: {
    where: { isActive: true },
    include: {
      mentor: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  },
};

function sanitizeUser(user) {
  if (!user) return user;
  const safeUser = { ...user };
  delete safeUser.passwordHash;
  return safeUser;
}

export class AdminUserService {
  static buildWhere(filters = {}, scopeRegionId = null) {
    return {
      deletedAt: null,
      ...(scopeRegionId ? { regionId: scopeRegionId } : {}),
      ...(!scopeRegionId && filters.regionId ? { regionId: filters.regionId } : {}),
      ...(filters.role ? { role: { code: filters.role } } : {}),
      ...(typeof filters.isActive === 'boolean' ? { isActive: filters.isActive } : {}),
      ...(filters.mentorId ? {
        mentorAssignmentsAsStudent: {
          some: {
            mentorId: filters.mentorId,
            isActive: true,
          },
        },
      } : {}),
      ...(filters.search ? {
        OR: [
          { fullName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      } : {}),
    };
  }

  static async findMany({ filters = {}, pagination = {}, scopeRegionId = null } = {}) {
    const page = pagination.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(pagination.limit ?? PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;
    const where = this.buildWhere(filters, scopeRegionId);

    const [total, users] = await Promise.all([
      UserRepository.countAdmin(where),
      UserRepository.findManyAdmin({ where, skip, take: limit }),
    ]);

    return {
      users: users.map(sanitizeUser),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async findById(id, { scopeRegionId = null } = {}) {
    const user = await UserRepository.findAdminById(id);

    if (!user || user.deletedAt) {
      throw ApiError.notFound('User not found');
    }

    if (scopeRegionId && user.regionId !== scopeRegionId) {
      throw ApiError.forbidden('Cannot access users outside your region');
    }

    return sanitizeUser(user);
  }

  static async getRoleById(roleId) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role || !role.isActive) {
      throw ApiError.badRequest('Role is not valid');
    }

    return role;
  }

  static async findAssignableRoles({ canAssignElevatedRoles = false } = {}) {
    return prisma.role.findMany({
      where: {
        isActive: true,
        ...(canAssignElevatedRoles ? {} : {
          code: {
            notIn: [ROLES.REGION_ADMIN, ROLES.SUPER_ADMIN],
          },
        }),
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getRegionById(regionId) {
    const region = await prisma.region.findUnique({
      where: { id: regionId },
    });

    if (!region || region.deletedAt || !region.isActive) {
      throw ApiError.badRequest('Region is not valid');
    }

    return region;
  }

  static async create(data, { actorId = null } = {}) {
    const role = await this.getRoleById(data.roleId);
    await this.getRegionById(data.regionId);

    const existingUser = await UserRepository.findByEmail(data.email);
    if (existingUser) {
      throw ApiError.badRequest('Email already in use');
    }

    const passwordHash = await hashPassword(data.password);
    const userData = { ...data };
    delete userData.password;

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          ...userData,
          passwordHash,
          onboardingStatus: ONBOARDING_STATUS.ACTIVE,
          timezone: userData.timezone ?? 'Africa/Cairo',
          isActive: userData.isActive ?? true,
        },
        include: ADMIN_USER_INCLUDE,
      });

      if (role.code === ROLES.USER) {
        await OnboardingService.createNormalUserOnboarding({ userId: createdUser.id }, tx);
      }

      return tx.user.findUnique({
        where: { id: createdUser.id },
        include: ADMIN_USER_INCLUDE,
      });
    });

    const safeUser = sanitizeUser(user);

    await AuditLogService.record({
      actorId,
      action: AUDIT_ACTIONS.USER_CREATED,
      targetType: AUDIT_TARGET_TYPES.USER,
      targetId: safeUser.id,
      regionId: safeUser.regionId,
      metadata: {
        fullName: safeUser.fullName,
        email: safeUser.email,
        roleId: safeUser.roleId,
        regionId: safeUser.regionId,
      },
    });

    return safeUser;
  }

  static async update(id, data, { scopeRegionId = null, actorId = null } = {}) {
    const before = await this.findById(id, { scopeRegionId });
    let nextRole = null;

    if (data.roleId) {
      nextRole = await this.getRoleById(data.roleId);
    }

    if (data.regionId) {
      await this.getRegionById(data.regionId);
    }

    try {
      const user = await prisma.user.update({
        where: { id },
        data,
        include: ADMIN_USER_INCLUDE,
      });

      const safeUser = sanitizeUser(user);
      const changes = buildChangedFieldsDiff(before, safeUser, [
        'fullName',
        'email',
        'phone',
        'avatarUrl',
        'timezone',
        'isActive',
      ]);

      if (Object.keys(changes).length > 0) {
        await AuditLogService.record({
          actorId,
          action: AUDIT_ACTIONS.USER_UPDATED,
          targetType: AUDIT_TARGET_TYPES.USER,
          targetId: safeUser.id,
          regionId: safeUser.regionId,
          metadata: { changes },
        });
      }

      if (
        before.roleId !== safeUser.roleId
        && [ROLES.REGION_ADMIN, ROLES.SUPER_ADMIN].includes(nextRole?.code)
      ) {
        await AuditLogService.record({
          actorId,
          action: AUDIT_ACTIONS.ROLE_CHANGED_TO_REGION_ADMIN,
          targetType: AUDIT_TARGET_TYPES.USER,
          targetId: safeUser.id,
          regionId: safeUser.regionId,
          metadata: {
            fromRoleId: before.roleId,
            toRoleId: safeUser.roleId,
          },
        });
      }

      return safeUser;
    } catch (error) {
      if (error.code === 'P2002') {
        throw ApiError.conflict('Email already in use', 'EMAIL_ALREADY_IN_USE');
      }
      throw error;
    }
  }

  static async setActive(id, isActive, { scopeRegionId = null, actorId = null } = {}) {
    const before = await this.findById(id, { scopeRegionId });

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      include: ADMIN_USER_INCLUDE,
    });

    const safeUser = sanitizeUser(user);

    if (before.isActive !== safeUser.isActive) {
      await AuditLogService.record({
        actorId,
        action: isActive ? AUDIT_ACTIONS.USER_REACTIVATED : AUDIT_ACTIONS.USER_DEACTIVATED,
        targetType: AUDIT_TARGET_TYPES.USER,
        targetId: safeUser.id,
        regionId: safeUser.regionId,
        metadata: {
          changes: {
            isActive: { from: before.isActive, to: safeUser.isActive },
          },
        },
      });
    }

    return safeUser;
  }

  static async transferRegion(id, regionId, { actorId = null } = {}) {
    const before = await this.findById(id);
    await this.getRegionById(regionId);

    const user = await prisma.user.update({
      where: { id },
      data: { regionId },
      include: ADMIN_USER_INCLUDE,
    });

    const safeUser = sanitizeUser(user);

    if (before.regionId !== safeUser.regionId) {
      await AuditLogService.record({
        actorId,
        action: AUDIT_ACTIONS.USER_REGION_TRANSFERRED,
        targetType: AUDIT_TARGET_TYPES.USER,
        targetId: safeUser.id,
        regionId: safeUser.regionId,
        metadata: {
          fromRegionId: before.regionId,
          toRegionId: safeUser.regionId,
        },
      });
    }

    return safeUser;
  }
}
