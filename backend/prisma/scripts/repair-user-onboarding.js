import { ONBOARDING_STATUS, PENDING_SETUP_REGION_NAME } from '../../src/constants/onboarding.js';
import { ROLES } from '../../src/constants/permissionRegistry.js';
import { prisma } from '../../src/lib/prisma.js';
import { OnboardingService } from '../../src/services/onboarding.service.js';

const summary = {
  scanned: 0,
  repaired: 0,
  unchanged: 0,
  warnings: [],
  failed: [],
};

function isPendingRegion(user) {
  return user.region?.name === PENDING_SETUP_REGION_NAME;
}

async function repairUser(user, defaultLevel) {
  let changed = false;

  const activeLevels = user.userLevels.filter((userLevel) => userLevel.isActive);
  const validActiveLevels = activeLevels.filter((userLevel) => (
    userLevel.worshipLevel?.isActive && !userLevel.worshipLevel.deletedAt
  ));
  const invalidActiveLevels = activeLevels.filter((userLevel) => (
    !userLevel.worshipLevel?.isActive || userLevel.worshipLevel.deletedAt
  ));

  if (invalidActiveLevels.length > 0) {
    summary.warnings.push({
      userId: user.id,
      email: user.email,
      reason: 'INVALID_ACTIVE_WORSHIP_LEVEL',
      userLevelIds: invalidActiveLevels.map((userLevel) => userLevel.id),
    });
  }

  await prisma.$transaction(async (tx) => {
    if (invalidActiveLevels.length > 0) {
      await tx.userLevel.updateMany({
        where: { id: { in: invalidActiveLevels.map((userLevel) => userLevel.id) } },
        data: { isActive: false },
      });
      changed = true;
    }

    if (validActiveLevels.length === 0) {
      const existingDefaultLevel = user.userLevels.find((userLevel) => (
        userLevel.levelId === defaultLevel.id && !userLevel.isActive
      ));

      if (existingDefaultLevel) {
        await tx.userLevel.update({
          where: { id: existingDefaultLevel.id },
          data: { isActive: true },
        });
      } else {
        await tx.userLevel.create({
          data: {
            userId: user.id,
            levelId: defaultLevel.id,
            isActive: true,
          },
        });
      }
      changed = true;
    } else if (validActiveLevels.length > 1) {
      const [currentLevel, ...duplicates] = [...validActiveLevels].sort((a, b) => {
        const assignedDelta = new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime();
        if (assignedDelta !== 0) return assignedDelta;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      await tx.userLevel.updateMany({
        where: { id: { in: duplicates.map((userLevel) => userLevel.id) } },
        data: { isActive: false },
      });
      summary.warnings.push({
        userId: user.id,
        email: user.email,
        reason: 'MULTIPLE_ACTIVE_WORSHIP_LEVELS',
        keptUserLevelId: currentLevel.id,
        deactivatedUserLevelIds: duplicates.map((userLevel) => userLevel.id),
      });
      changed = true;
    }

    const nextStatus = user.role?.code === ROLES.USER && isPendingRegion(user)
      ? ONBOARDING_STATUS.PENDING_SETUP
      : ONBOARDING_STATUS.ACTIVE;

    if (user.onboardingStatus !== nextStatus) {
      await tx.user.update({
        where: { id: user.id },
        data: { onboardingStatus: nextStatus },
      });
      changed = true;
    }
  });

  if (changed) {
    summary.repaired += 1;
  } else {
    summary.unchanged += 1;
  }
}

async function main() {
  await OnboardingService.ensurePendingSetupRegion();
  const defaultLevel = await OnboardingService.getLowestActiveWorshipLevel();

  if (!defaultLevel) {
    throw new Error('No active Worship Level exists. Seed or configure at least one active Worship Level first.');
  }

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      role: { code: ROLES.USER },
    },
    include: {
      role: true,
      region: true,
      userLevels: {
        include: { worshipLevel: true },
        orderBy: [
          { assignedAt: 'desc' },
          { createdAt: 'desc' },
        ],
      },
    },
  });

  summary.scanned = users.length;

  for (const user of users) {
    try {
      await repairUser(user, defaultLevel);
    } catch (error) {
      summary.failed.push({
        userId: user.id,
        email: user.email,
        message: error.message,
      });
    }
  }

  console.log(JSON.stringify(summary, null, 2));

  if (summary.failed.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
