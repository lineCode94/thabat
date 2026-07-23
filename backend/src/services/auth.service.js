import { MENTOR_ASSIGNMENT_STATUS, ONBOARDING_STATUS } from '#constants/onboarding.js';
import { ROLES } from '#constants/permissionRegistry.js';
import { hashPassword, verifyPassword } from '#lib/hash.js';
import { generateToken } from '#lib/jwt.js';
import { prisma } from '#lib/prisma.js';
import { UserRepository } from '#repositories/user.repository.js';
import { OnboardingService } from '#services/onboarding.service.js';
import { PermissionService } from '#services/permission.service.js';
import { ApiError } from '#utils/apiError.js';

export class AuthService {
  static async register(data) {
    const { fullName, email, password, timezone = 'Africa/Cairo' } = data;

    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw ApiError.badRequest('Email already in use');
    }

    let userRole = await prisma.role.findUnique({ where: { code: ROLES.USER } });
    if (!userRole) {
      await PermissionService.syncRegistry();
      userRole = await prisma.role.findUnique({ where: { code: ROLES.USER } });
    }
    if (!userRole) {
      throw ApiError.conflict('Registration is temporarily unavailable because the USER role is not configured.', 'USER_ROLE_NOT_CONFIGURED');
    }

    const passwordHash = await hashPassword(password);

    const { user, activeUserLevel } = await prisma.$transaction(async (tx) => {
      const pendingSetupRegion = await OnboardingService.ensurePendingSetupRegion(tx);
      const createdUser = await tx.user.create({
        data: {
          fullName,
          email,
          passwordHash,
          timezone,
          roleId: userRole.id,
          regionId: pendingSetupRegion.id,
          onboardingStatus: ONBOARDING_STATUS.PENDING_SETUP,
        },
        include: {
          role: true,
          region: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
      });
      const userLevel = await OnboardingService.createNormalUserOnboarding(
        { userId: createdUser.id },
        tx,
      );

      return { user: createdUser, activeUserLevel: userLevel };
    });

    const token = generateToken({ userId: user.id });
    const userWithoutPassword = OnboardingService.toSessionUser(
      user,
      activeUserLevel,
      MENTOR_ASSIGNMENT_STATUS.PENDING,
    );

    return { user: userWithoutPassword, token };
  }

  static async login(data) {
    const { email, password } = data;

    const user = await UserRepository.findByEmail(email);

    if (!user || user.deletedAt) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Account is deactivated');
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const token = generateToken({ userId: user.id });
    const userWithoutPassword = await OnboardingService.getUserSessionContext(user.id);

    return { user: userWithoutPassword, token };
  }
}
