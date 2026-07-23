import 'dotenv/config';

import { ONBOARDING_STATUS } from '../../src/constants/onboarding.js';
import { ROLES } from '../../src/constants/permissionRegistry.js';
import { hashPassword } from '../../src/lib/hash.js';
import { prisma } from '../../src/lib/prisma.js';
import { OnboardingService } from '../../src/services/onboarding.service.js';
import { TrackingService } from '../../src/services/tracking.service.js';

const TEST_PASSWORD = 'Password123';
const runId = Date.now();
const testEmail = `verify.worship.level.${runId}@example.com`;

function log(message) {
  console.log(message);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function dateAtUtc(dateKey) {
  return new Date(`${dateKey}T12:00:00Z`);
}

async function getRole(code) {
  const role = await prisma.role.findUnique({ where: { code } });
  assert(role, `Missing role ${code}`);
  return role;
}

async function createVerificationUser() {
  const [role, region, passwordHash] = await Promise.all([
    getRole(ROLES.USER),
    prisma.region.findFirst({ where: { isActive: true, deletedAt: null }, orderBy: { createdAt: 'asc' } }),
    hashPassword(TEST_PASSWORD),
  ]);

  assert(region, 'Missing active region for verification user');

  const user = await prisma.user.create({
    data: {
      email: testEmail,
      fullName: 'Verify Worship Level User',
      passwordHash,
      roleId: role.id,
      regionId: region.id,
      onboardingStatus: ONBOARDING_STATUS.ACTIVE,
      isActive: true,
      timezone: 'Africa/Cairo',
    },
  });

  const userLevel = await OnboardingService.createNormalUserOnboarding({ userId: user.id });

  return { user, userLevel };
}

async function cleanupVerificationData() {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: 'verify.worship.level.' } },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);

  if (userIds.length === 0) {
    return;
  }

  const trackingDays = await prisma.trackingDay.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const trackingDayIds = trackingDays.map((day) => day.id);

  const [xp, entries, days, userLevels, deletedUsers] = await prisma.$transaction([
    prisma.xPTransaction.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.trackingEntry.deleteMany({ where: { trackingDayId: { in: trackingDayIds } } }),
    prisma.trackingDay.deleteMany({ where: { id: { in: trackingDayIds } } }),
    prisma.userLevel.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.user.deleteMany({ where: { id: { in: userIds } } }),
  ]);

  log(`Cleanup removed users=${deletedUsers.count}, userLevels=${userLevels.count}, trackingDays=${days.count}, trackingEntries=${entries.count}, xpTransactions=${xp.count}`);
}

async function pass(name, fn) {
  try {
    const details = await fn();
    log(`PASS ${name}${details ? ` :: ${details}` : ''}`);
  } catch (error) {
    log(`FAIL ${name} :: ${error.message}`);
    throw error;
  }
}

async function main() {
  log('Worship level wiring verification started');
  await cleanupVerificationData();

  const firstLevel = await prisma.worshipLevel.findFirst({
    where: { order: 1, isActive: true, deletedAt: null },
    include: { _count: { select: { requirements: true, userLevels: true } } },
  });

  await pass('1. المستوى الأول exists and owns beginner requirements', async () => {
    assert(firstLevel, 'Missing active order 1 worship level');
    assert(firstLevel.name === 'المستوى الأول', `Expected المستوى الأول, got ${firstLevel.name}`);
    assert(firstLevel._count.requirements === 56, `Expected 56 requirements, got ${firstLevel._count.requirements}`);
    return `levelId=${firstLevel.id}, requirements=${firstLevel._count.requirements}`;
  });

  const { user, userLevel } = await createVerificationUser();

  await pass('2. New user onboarding assigns المستوى الأول', async () => {
    assert(userLevel.worshipLevel.name === 'المستوى الأول', `Expected المستوى الأول, got ${userLevel.worshipLevel.name}`);
    assert(userLevel.levelId === firstLevel.id, 'UserLevel does not point to order 1 level');
    return `userId=${user.id}, level=${userLevel.worshipLevel.name}`;
  });

  let mondayReadiness = null;
  let fridayReadiness = null;

  await pass('3. Non-Friday readiness excludes Friday-only items', async () => {
    mondayReadiness = await OnboardingService.resolveTodayWorshipReadiness(
      user.id,
      prisma,
      dateAtUtc('2026-07-23'),
    );
    assert(mondayReadiness.ready, `Expected ready=true, got ${mondayReadiness.reason}`);
    assert(mondayReadiness.items.length === 48, `Expected 48 non-Friday items, got ${mondayReadiness.items.length}`);
    assert(!mondayReadiness.items.some((item) => item.category.name === 'أعمال الجمعة'), 'Friday category leaked into non-Friday readiness');
    return `items=${mondayReadiness.items.length}`;
  });

  await pass('4. Friday readiness includes Friday-only items', async () => {
    fridayReadiness = await OnboardingService.resolveTodayWorshipReadiness(
      user.id,
      prisma,
      dateAtUtc('2026-07-24'),
    );
    assert(fridayReadiness.ready, `Expected ready=true, got ${fridayReadiness.reason}`);
    assert(fridayReadiness.items.length === 56, `Expected 56 Friday items, got ${fridayReadiness.items.length}`);
    assert(fridayReadiness.items.some((item) => item.category.name === 'أعمال الجمعة'), 'Friday category missing on Friday');
    return `items=${fridayReadiness.items.length}`;
  });

  const booleanItem = mondayReadiness.items.find((item) => item.inputType === 'BOOLEAN');
  const counterItem = mondayReadiness.items.find((item) => item.inputType === 'COUNT' && item.targetValue === 100);
  assert(booleanItem, 'Missing boolean item in readiness');
  assert(counterItem, 'Missing target=100 counter item in readiness');

  await pass('5. Boolean item can be submitted incomplete then complete', async () => {
    const firstSubmit = await TrackingService.submitTrackingForDate(user.id, user.timezone, dateAtUtc('2026-07-23'), [
      { worshipItemId: booleanItem.id, isCompleted: false },
    ]);
    const firstEntry = firstSubmit.trackingDay.trackingEntries.find((entry) => entry.worshipItemId === booleanItem.id);
    assert(firstEntry && firstEntry.isCompleted === false, 'Expected boolean item incomplete after false submit');

    const secondSubmit = await TrackingService.submitTrackingForDate(user.id, user.timezone, dateAtUtc('2026-07-23'), [
      { worshipItemId: booleanItem.id, isCompleted: true },
    ]);
    const secondEntry = secondSubmit.trackingDay.trackingEntries.find((entry) => entry.worshipItemId === booleanItem.id);
    assert(secondEntry && secondEntry.isCompleted === true, 'Expected boolean item complete after true submit');
    return `item=${booleanItem.title}`;
  });

  await pass('6. Counter item completes only at targetValue', async () => {
    const belowSubmit = await TrackingService.submitTrackingForDate(user.id, user.timezone, dateAtUtc('2026-07-23'), [
      { worshipItemId: counterItem.id, count: 99 },
    ]);
    const belowEntry = belowSubmit.trackingDay.trackingEntries.find((entry) => entry.worshipItemId === counterItem.id);
    assert(belowEntry && belowEntry.isCompleted === false, `Expected count 99 incomplete, got ${belowEntry?.isCompleted}`);

    const targetSubmit = await TrackingService.submitTrackingForDate(user.id, user.timezone, dateAtUtc('2026-07-23'), [
      { worshipItemId: counterItem.id, count: 100 },
    ]);
    const targetEntry = targetSubmit.trackingDay.trackingEntries.find((entry) => entry.worshipItemId === counterItem.id);
    assert(targetEntry && targetEntry.isCompleted === true, `Expected count 100 complete, got ${targetEntry?.isCompleted}`);
    return `item=${counterItem.title}, target=${counterItem.targetValue}`;
  });

  await cleanupVerificationData();
  log('Worship level wiring verification completed successfully');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
