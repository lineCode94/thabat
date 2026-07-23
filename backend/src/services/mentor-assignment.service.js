import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '#constants/auditLog.js';
import { ROLES } from '#constants/permissionRegistry.js';
import { prisma } from '#lib/prisma.js';
import { AuditLogService } from '#services/audit-log.service.js';
import { ApiError } from '#utils/apiError.js';

const MENTOR_ASSIGNMENT_INCLUDE = {
  mentor: {
    select: {
      id: true,
      fullName: true,
      email: true,
      regionId: true,
      role: {
        select: {
          code: true,
          name: true,
        },
      },
      region: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  student: {
    select: {
      id: true,
      fullName: true,
      email: true,
      regionId: true,
      role: {
        select: {
          code: true,
          name: true,
        },
      },
      region: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
};

const MENTOR_SELECT = {
  id: true,
  fullName: true,
  email: true,
  regionId: true,
  isActive: true,
  role: {
    select: {
      code: true,
      name: true,
    },
  },
  region: {
    select: {
      id: true,
      name: true,
    },
  },
};

const ASSIGNED_USER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  regionId: true,
  isActive: true,
  onboardingStatus: true,
  role: {
    select: {
      code: true,
      name: true,
    },
  },
  region: {
    select: {
      id: true,
      name: true,
    },
  },
};

function buildAssignmentWhere(filters = {}, scopeRegionId = null) {
  return {
    ...(filters.includeInactive ? {} : { isActive: true }),
    ...(filters.mentorId ? { mentorId: filters.mentorId } : {}),
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(scopeRegionId
      ? {
        mentor: { regionId: scopeRegionId },
        student: { regionId: scopeRegionId },
      }
      : filters.regionId
        ? {
          mentor: { regionId: filters.regionId },
          student: { regionId: filters.regionId },
        }
        : {}),
  };
}

function buildMentorWhere(filters = {}, scopeRegionId = null) {
  return {
    deletedAt: null,
    isActive: true,
    role: {
      code: {
        in: [ROLES.MENTOR, ROLES.REGION_ADMIN],
      },
    },
    ...(scopeRegionId ? { regionId: scopeRegionId } : {}),
    ...(!scopeRegionId && filters.regionId ? { regionId: filters.regionId } : {}),
    ...(filters.search ? {
      OR: [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ],
    } : {}),
  };
}

async function getAssignableUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, region: true },
  });

  if (!user || user.deletedAt || !user.isActive) {
    throw ApiError.badRequest('Target user is not valid');
  }

  if (user.role.code !== ROLES.USER) {
    throw ApiError.badRequest('Target user must have USER role');
  }

  return user;
}

async function getAssignableMentor(mentorId) {
  const mentor = await prisma.user.findUnique({
    where: { id: mentorId },
    include: { role: true, region: true },
  });

  if (!mentor || mentor.deletedAt || !mentor.isActive) {
    throw ApiError.badRequest('Target mentor is not valid');
  }

  if (![ROLES.MENTOR, ROLES.REGION_ADMIN].includes(mentor.role.code)) {
    throw ApiError.badRequest('Target mentor must have MENTOR or REGION_ADMIN role');
  }

  return mentor;
}

function assertAssignmentScope({ user, mentor, scopeRegionId }) {
  if (scopeRegionId && (user.regionId !== scopeRegionId || mentor.regionId !== scopeRegionId)) {
    throw ApiError.forbidden('Region admins can only manage mentor assignments inside their own region');
  }

  if (user.regionId !== mentor.regionId) {
    throw ApiError.badRequest('User and mentor must belong to the same region');
  }
}

export class MentorAssignmentService {
  static async findMentors({ filters = {}, scopeRegionId = null } = {}) {
    const mentors = await prisma.user.findMany({
      where: buildMentorWhere(filters, scopeRegionId),
      select: MENTOR_SELECT,
      orderBy: { fullName: 'asc' },
    });

    if (mentors.length === 0) {
      return [];
    }

    const counts = await prisma.mentorAssignment.groupBy({
      by: ['mentorId'],
      where: {
        isActive: true,
        mentorId: {
          in: mentors.map((mentor) => mentor.id),
        },
      },
      _count: {
        userId: true,
      },
    });
    const countByMentorId = new Map(
      counts.map((count) => [count.mentorId, count._count.userId]),
    );

    return mentors.map((mentor) => ({
      ...mentor,
      activeUserCount: countByMentorId.get(mentor.id) ?? 0,
    }));
  }

  static async findMany({ filters = {}, scopeRegionId = null } = {}) {
    const assignments = await prisma.mentorAssignment.findMany({
      where: buildAssignmentWhere(filters, scopeRegionId),
      include: MENTOR_ASSIGNMENT_INCLUDE,
      orderBy: [
        { isActive: 'desc' },
        { assignedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return assignments;
  }

  static async findCurrentForUser(userId, { scopeRegionId = null } = {}) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        regionId: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw ApiError.notFound('User not found');
    }

    if (scopeRegionId && user.regionId !== scopeRegionId) {
      throw ApiError.forbidden('Cannot access users outside your region');
    }

    return prisma.mentorAssignment.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: MENTOR_ASSIGNMENT_INCLUDE,
      orderBy: [
        { assignedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  static async findUsersForMentor(mentorId, { scopeRegionId = null, ownMentorId = null } = {}) {
    if (ownMentorId && mentorId !== ownMentorId) {
      throw ApiError.forbidden('Mentors can only view their own assigned users');
    }

    const mentor = await prisma.user.findUnique({
      where: { id: mentorId },
      include: { role: true },
    });

    if (!mentor || mentor.deletedAt || !mentor.isActive) {
      throw ApiError.notFound('Mentor not found');
    }

    if (![ROLES.MENTOR, ROLES.REGION_ADMIN].includes(mentor.role.code)) {
      throw ApiError.badRequest('Target mentor must have MENTOR or REGION_ADMIN role');
    }

    if (scopeRegionId && mentor.regionId !== scopeRegionId) {
      throw ApiError.forbidden('Cannot access mentors outside your region');
    }

    const assignments = await prisma.mentorAssignment.findMany({
      where: {
        mentorId,
        isActive: true,
        ...(scopeRegionId ? { student: { regionId: scopeRegionId } } : {}),
      },
      include: {
        student: {
          select: ASSIGNED_USER_SELECT,
        },
      },
      orderBy: [
        { assignedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return assignments.map((assignment) => ({
      ...assignment.student,
      mentorAssignment: {
        id: assignment.id,
        mentorId: assignment.mentorId,
        assignedAt: assignment.assignedAt,
        isActive: assignment.isActive,
      },
    }));
  }

  static async assign({ userId, mentorId }, { scopeRegionId = null, actorId = null } = {}) {
    const [user, mentor] = await Promise.all([
      getAssignableUser(userId),
      getAssignableMentor(mentorId),
    ]);

    assertAssignmentScope({ user, mentor, scopeRegionId });

    const existingActiveAssignment = await prisma.mentorAssignment.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: MENTOR_ASSIGNMENT_INCLUDE,
      orderBy: [
        { assignedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    if (existingActiveAssignment?.mentorId === mentorId) {
      return existingActiveAssignment;
    }

    const fromMentorId = existingActiveAssignment?.mentorId ?? null;
    const assignment = await prisma.$transaction(async (tx) => {
      await tx.mentorAssignment.updateMany({
        where: {
          userId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      return tx.mentorAssignment.create({
        data: {
          userId,
          mentorId,
          isActive: true,
        },
        include: MENTOR_ASSIGNMENT_INCLUDE,
      });
    });

    await AuditLogService.record({
      actorId,
      action: fromMentorId ? AUDIT_ACTIONS.MENTOR_TRANSFERRED : AUDIT_ACTIONS.MENTOR_ASSIGNED,
      targetType: AUDIT_TARGET_TYPES.MENTOR_ASSIGNMENT,
      targetId: assignment.id,
      regionId: assignment.student?.regionId ?? user.regionId,
      metadata: fromMentorId
        ? { userId, fromMentorId, toMentorId: mentorId }
        : { userId, toMentorId: mentorId },
    });

    return assignment;
  }

  static async transfer(userId, { mentorId }, { scopeRegionId = null, actorId = null } = {}) {
    return this.assign({ userId, mentorId }, { scopeRegionId, actorId });
  }

  static async deactivate(id, { scopeRegionId = null, actorId = null } = {}) {
    const assignment = await prisma.mentorAssignment.findUnique({
      where: { id },
      include: MENTOR_ASSIGNMENT_INCLUDE,
    });

    if (!assignment) {
      throw ApiError.notFound('Mentor assignment not found');
    }

    if (
      scopeRegionId
      && (
        assignment.student?.regionId !== scopeRegionId
        || assignment.mentor?.regionId !== scopeRegionId
      )
    ) {
      throw ApiError.forbidden('Region admins can only manage mentor assignments inside their own region');
    }

    if (!assignment.isActive) {
      throw ApiError.badRequest('Mentor assignment is already inactive');
    }

    const deactivated = await prisma.mentorAssignment.update({
      where: { id },
      data: { isActive: false },
      include: MENTOR_ASSIGNMENT_INCLUDE,
    });

    await AuditLogService.record({
      actorId,
      action: AUDIT_ACTIONS.MENTOR_ASSIGNMENT_DEACTIVATED,
      targetType: AUDIT_TARGET_TYPES.MENTOR_ASSIGNMENT,
      targetId: deactivated.id,
      regionId: deactivated.student?.regionId ?? null,
      metadata: {
        userId: deactivated.userId,
        mentorId: deactivated.mentorId,
      },
    });

    return deactivated;
  }
}
