import 'dotenv/config';

import { ONBOARDING_STATUS } from '../../src/constants/onboarding.js';
import { ROLES } from '../../src/constants/permissionRegistry.js';
import { hashPassword } from '../../src/lib/hash.js';
import { prisma } from '../../src/lib/prisma.js';
import { OnboardingService } from '../../src/services/onboarding.service.js';
import { PermissionService } from '../../src/services/permission.service.js';
import { addDays, getThabatWeekRange, toDateKey } from '../../src/utils/week.js';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5001/api/v1';
const ADMIN_EMAIL = process.env.VERIFY_ADMIN_EMAIL ?? process.env.SEED_ADMIN_EMAIL ?? 'dev-admin@example.local';
const ADMIN_PASSWORD = process.env.VERIFY_ADMIN_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD ?? 'dev-only-seed-password-change-me';
const TEST_PASSWORD = 'Password123';
const runId = Date.now();

function log(message) {
  console.log(message);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return { status: response.status, payload };
}

async function login(email, password) {
  const response = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });

  assert(response.status === 200, `Login failed for ${email}: ${response.status}`);
  return response.payload.data.token;
}

async function getRole(code) {
  const role = await prisma.role.findUnique({ where: { code } });
  assert(role, `Missing role ${code}`);
  return role;
}

async function createUser({ email, fullName, roleId, roleCode, regionId }) {
  const passwordHash = await hashPassword(TEST_PASSWORD);
  const user = await prisma.user.create({
    data: {
      email,
      fullName,
      passwordHash,
      roleId,
      regionId,
      onboardingStatus: ONBOARDING_STATUS.ACTIVE,
      isActive: true,
      timezone: 'Africa/Cairo',
    },
    include: { role: true },
  });

  if ((roleCode ?? user.role.code) === ROLES.USER) {
    await OnboardingService.createNormalUserOnboarding({ userId: user.id });
  }

  return user;
}

async function ensureVerificationWorshipSetup() {
  const category = await prisma.worshipCategory.create({
    data: {
      name: `Verify Weekly Report Category ${runId}`,
      description: 'Verification-only worship category',
      isActive: true,
    },
  });

  const itemA = await prisma.worshipItem.create({
    data: {
      categoryId: category.id,
      title: `Verify Weekly Report Item A ${runId}`,
      inputType: 'boolean',
      targetType: 'boolean',
      order: -Number(String(runId).slice(-8)),
      score: 10,
      xp: 5,
      isActive: true,
    },
  });

  const itemB = await prisma.worshipItem.create({
    data: {
      categoryId: category.id,
      title: `Verify Weekly Report Item B ${runId}`,
      inputType: 'boolean',
      targetType: 'boolean',
      order: -Number(String(runId).slice(-8)) + 1,
      score: 20,
      xp: 10,
      isActive: true,
    },
  });

  const level = await prisma.worshipLevel.create({
    data: {
      name: `Verify Weekly Report Level ${runId}`,
      order: -Number(String(runId).slice(-8)),
      description: 'Verification-only worship level',
      isActive: true,
    },
  });

  await prisma.levelRequirement.createMany({
    data: [
      { levelId: level.id, worshipItemId: itemA.id },
      { levelId: level.id, worshipItemId: itemB.id },
    ],
  });

  return { category, itemA, itemB, level };
}

async function setup() {
  await PermissionService.syncRegistry();
  const worship = await ensureVerificationWorshipSetup();

  const [userRole, mentorRole] = await Promise.all([
    getRole(ROLES.USER),
    getRole(ROLES.MENTOR),
  ]);

  const region = await prisma.region.create({
    data: {
      name: `Verify Weekly Report Region ${runId}`,
      description: 'Verification region',
      isActive: true,
    },
  });

  const mentor = await createUser({
    email: `verify.weekly.report.mentor.${runId}@example.com`,
    fullName: 'Verify Weekly Report Mentor',
    roleId: mentorRole.id,
    roleCode: ROLES.MENTOR,
    regionId: region.id,
  });

  const reportUser = await createUser({
    email: `verify.weekly.report.user.${runId}@example.com`,
    fullName: 'Verify Weekly Report User',
    roleId: userRole.id,
    roleCode: ROLES.USER,
    regionId: region.id,
  });

  const assignedUser = await createUser({
    email: `verify.weekly.report.assigned.${runId}@example.com`,
    fullName: 'Verify Weekly Report Assigned User',
    roleId: userRole.id,
    roleCode: ROLES.USER,
    regionId: region.id,
  });

  const unassignedUser = await createUser({
    email: `verify.weekly.report.unassigned.${runId}@example.com`,
    fullName: 'Verify Weekly Report Unassigned User',
    roleId: userRole.id,
    roleCode: ROLES.USER,
    regionId: region.id,
  });

  await prisma.mentorAssignment.create({
    data: {
      mentorId: mentor.id,
      userId: assignedUser.id,
      isActive: true,
    },
  });

  return { worship, region, users: { mentor, reportUser, assignedUser, unassignedUser } };
}

async function createTrackingEntry({ userId, date, item, isCompleted }) {
  const day = await prisma.trackingDay.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, status: 'CLOSED' },
    update: { status: 'CLOSED' },
  });

  const entry = await prisma.trackingEntry.upsert({
    where: {
      trackingDayId_worshipItemId: {
        trackingDayId: day.id,
        worshipItemId: item.id,
      },
    },
    create: {
      trackingDayId: day.id,
      worshipItemId: item.id,
      isCompleted,
      scoreEarned: isCompleted ? item.score : 0,
    },
    update: {
      isCompleted,
      scoreEarned: isCompleted ? item.score : 0,
    },
  });

  if (isCompleted) {
    await prisma.xPTransaction.upsert({
      where: {
        userId_sourceType_sourceId: {
          userId,
          sourceType: 'TRACKING_ENTRY',
          sourceId: entry.id,
        },
      },
      create: {
        userId,
        amount: item.xp,
        reason: `Verify weekly report ${item.title}`,
        sourceType: 'TRACKING_ENTRY',
        sourceId: entry.id,
        createdAt: date,
      },
      update: {
        amount: item.xp,
        createdAt: date,
      },
    });
  }
}

async function seedKnownTracking(userId, worship, currentWeek, previousWeek) {
  await createTrackingEntry({ userId, date: currentWeek.weekStartDate, item: worship.itemA, isCompleted: true });
  await createTrackingEntry({ userId, date: currentWeek.weekStartDate, item: worship.itemB, isCompleted: false });
  await createTrackingEntry({ userId, date: addDays(currentWeek.weekStartDate, 1), item: worship.itemA, isCompleted: true });
  await createTrackingEntry({ userId, date: addDays(currentWeek.weekStartDate, 1), item: worship.itemB, isCompleted: true });

  await createTrackingEntry({ userId, date: previousWeek.weekStartDate, item: worship.itemA, isCompleted: true });
  await createTrackingEntry({ userId, date: previousWeek.weekStartDate, item: worship.itemB, isCompleted: false });
}

async function cleanupVerificationData() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        startsWith: 'verify.weekly.report.',
        endsWith: `.${runId}@example.com`,
      },
    },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);

  const regions = await prisma.region.findMany({
    where: { name: { startsWith: 'Verify Weekly Report ', contains: String(runId) } },
    select: { id: true },
  });
  const regionIds = regions.map((region) => region.id);

  const levels = await prisma.worshipLevel.findMany({
    where: { name: { startsWith: 'Verify Weekly Report Level ', contains: String(runId) } },
    select: { id: true },
  });
  const levelIds = levels.map((level) => level.id);

  const items = await prisma.worshipItem.findMany({
    where: { title: { startsWith: 'Verify Weekly Report Item ', contains: String(runId) } },
    select: { id: true },
  });
  const itemIds = items.map((item) => item.id);

  const categories = await prisma.worshipCategory.findMany({
    where: { name: { startsWith: 'Verify Weekly Report Category ', contains: String(runId) } },
    select: { id: true },
  });
  const categoryIds = categories.map((category) => category.id);

  const trackingDays = await prisma.trackingDay.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const trackingDayIds = trackingDays.map((day) => day.id);

  const [
    reports,
    trackingEntries,
    trackingDayDelete,
    xpTransactions,
    mentorAssignments,
    userLevels,
    usersDelete,
    levelRequirements,
    worshipItemsDelete,
    worshipLevelsDelete,
    worshipCategoriesDelete,
    regionsDelete,
  ] = await prisma.$transaction([
    prisma.report.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.trackingEntry.deleteMany({ where: { trackingDayId: { in: trackingDayIds } } }),
    prisma.trackingDay.deleteMany({ where: { id: { in: trackingDayIds } } }),
    prisma.xPTransaction.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.mentorAssignment.deleteMany({
      where: {
        OR: [
          { userId: { in: userIds } },
          { mentorId: { in: userIds } },
        ],
      },
    }),
    prisma.userLevel.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.user.deleteMany({ where: { id: { in: userIds } } }),
    prisma.levelRequirement.deleteMany({
      where: {
        OR: [
          { levelId: { in: levelIds } },
          { worshipItemId: { in: itemIds } },
        ],
      },
    }),
    prisma.worshipItem.deleteMany({ where: { id: { in: itemIds } } }),
    prisma.worshipLevel.deleteMany({ where: { id: { in: levelIds } } }),
    prisma.worshipCategory.deleteMany({ where: { id: { in: categoryIds } } }),
    prisma.region.deleteMany({ where: { id: { in: regionIds } } }),
  ]);

  log(
    `Cleanup removed reports=${reports.count}, trackingEntries=${trackingEntries.count}, trackingDays=${trackingDayDelete.count}, xpTransactions=${xpTransactions.count}, mentorAssignments=${mentorAssignments.count}, userLevels=${userLevels.count}, users=${usersDelete.count}, levelRequirements=${levelRequirements.count}, worshipItems=${worshipItemsDelete.count}, worshipLevels=${worshipLevelsDelete.count}, worshipCategories=${worshipCategoriesDelete.count}, regions=${regionsDelete.count}`,
  );
}

async function pass(name, promise) {
  try {
    const details = await promise();
    log(`PASS ${name}${details ? ` :: ${details}` : ''}`);
  } catch (error) {
    log(`FAIL ${name} :: ${error.message}`);
    throw error;
  }
}

async function main() {
  log('Weekly Reports verification started');
  log(`API_BASE_URL=${API_BASE_URL}`);

  const context = await setup();
  const superToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  const mentorToken = await login(context.users.mentor.email, TEST_PASSWORD);
  const userToken = await login(context.users.reportUser.email, TEST_PASSWORD);

  const currentWeek = getThabatWeekRange(context.users.reportUser.timezone);
  const closedWeek = getThabatWeekRange(context.users.reportUser.timezone, addDays(currentWeek.weekStartDate, -7));
  const previousWeek = getThabatWeekRange(context.users.reportUser.timezone, addDays(closedWeek.weekStartDate, -7));
  await seedKnownTracking(context.users.reportUser.id, context.worship, closedWeek, previousWeek);
  await seedKnownTracking(context.users.assignedUser.id, context.worship, closedWeek, previousWeek);
  await seedKnownTracking(context.users.unassignedUser.id, context.worship, closedWeek, previousWeek);

  let generatedReport = null;

  await pass('1. Generate weekly report for closed week with known metrics', async () => {
    const response = await request(`/reports/weekly?weekStartDate=${closedWeek.weekStartKey}`, {
      token: userToken,
    });

    assert(response.status === 200, `expected 200, got ${response.status}`);
    generatedReport = response.payload.data;
    assert(generatedReport.type === 'WEEKLY', `expected WEEKLY, got ${generatedReport.type}`);
    assert(generatedReport.periodStartDate.startsWith(closedWeek.weekStartKey), `expected period ${closedWeek.weekStartKey}`);
    assert(generatedReport.data.totals.xpEarned === 20, `expected xpEarned 20, got ${generatedReport.data.totals.xpEarned}`);
    assert(generatedReport.data.totals.consistencyPercentage === 67, `expected consistency 67, got ${generatedReport.data.totals.consistencyPercentage}`);
    assert(generatedReport.data.totals.worshipCompletionPercentage === 75, `expected completion 75, got ${generatedReport.data.totals.worshipCompletionPercentage}`);
    assert(generatedReport.data.comparison.xpDelta === 15, `expected xpDelta 15, got ${generatedReport.data.comparison.xpDelta}`);
    assert(generatedReport.data.comparison.consistencyDelta === 34, `expected consistencyDelta 34, got ${generatedReport.data.comparison.consistencyDelta}`);
    assert(generatedReport.data.worshipBreakdown.length === 2, `expected 2 breakdown rows, got ${generatedReport.data.worshipBreakdown.length}`);
    return `reportId=${generatedReport.id}, xp=${generatedReport.data.totals.xpEarned}, consistency=${generatedReport.data.totals.consistencyPercentage}, completion=${generatedReport.data.totals.worshipCompletionPercentage}`;
  });

  await pass('2. Requesting same weekly report returns immutable cached report', async () => {
    const response = await request(`/reports/weekly?weekStartDate=${closedWeek.weekStartKey}`, {
      token: userToken,
    });

    assert(response.status === 200, `expected 200, got ${response.status}`);
    assert(response.payload.data.id === generatedReport.id, `expected same id ${generatedReport.id}, got ${response.payload.data.id}`);
    assert(response.payload.data.createdAt === generatedReport.createdAt, 'expected same createdAt');
    return `reportId=${response.payload.data.id}, createdAt=${response.payload.data.createdAt}`;
  });

  await pass('3. Reopening a reported week still returns frozen original report', async () => {
    const reopenResponse = await request(`/admin/tracking/weeks/${closedWeek.weekStartKey}/reopen`, {
      method: 'POST',
      token: superToken,
      body: { userId: context.users.reportUser.id },
    });

    assert(reopenResponse.status === 200, `expected reopen 200, got ${reopenResponse.status}`);

    const response = await request(`/reports/weekly?weekStartDate=${closedWeek.weekStartKey}`, {
      token: userToken,
    });

    assert(response.status === 200, `expected 200, got ${response.status}`);
    assert(response.payload.data.id === generatedReport.id, `expected frozen report id ${generatedReport.id}, got ${response.payload.data.id}`);
    assert(response.payload.data.data.totals.xpEarned === generatedReport.data.totals.xpEarned, 'expected frozen xp');
    return `reopenStatus=${reopenResponse.status}, frozenReportId=${response.payload.data.id}`;
  });

  await pass('4. Open/reopened week without existing report returns WEEK_NOT_CLOSED', async () => {
    const reopenResponse = await request(`/admin/tracking/weeks/${closedWeek.weekStartKey}/reopen`, {
      method: 'POST',
      token: superToken,
      body: { userId: context.users.unassignedUser.id },
    });

    assert(reopenResponse.status === 200, `expected reopen 200, got ${reopenResponse.status}`);

    const response = await request(`/reports/weekly?userId=${context.users.unassignedUser.id}&weekStartDate=${closedWeek.weekStartKey}`, {
      token: superToken,
    });

    assert(response.status === 400, `expected 400, got ${response.status}`);
    assert(response.payload.error.code === 'WEEK_NOT_CLOSED', `expected WEEK_NOT_CLOSED, got ${response.payload.error.code}`);
    return `status=${response.status}, code=${response.payload.error.code}`;
  });

  await pass('5. Mentor can view assigned user weekly report', async () => {
    const response = await request(`/reports/weekly?userId=${context.users.assignedUser.id}&weekStartDate=${closedWeek.weekStartKey}`, {
      token: mentorToken,
    });

    assert(response.status === 200, `expected 200, got ${response.status}`);
    assert(response.payload.data.userId === context.users.assignedUser.id, 'expected assigned user report');
    return `status=${response.status}, reportId=${response.payload.data.id}`;
  });

  await pass('6. Mentor cannot view non-assigned user weekly report', async () => {
    const response = await request(`/reports/weekly?userId=${context.users.unassignedUser.id}&weekStartDate=${closedWeek.weekStartKey}`, {
      token: mentorToken,
    });

    assert(response.status === 403, `expected 403, got ${response.status}`);
    return `status=${response.status}, code=${response.payload.error.code}`;
  });

  await cleanupVerificationData();

  log('Weekly Reports verification completed successfully');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
