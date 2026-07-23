import 'dotenv/config';

import { ONBOARDING_STATUS } from '../../src/constants/onboarding.js';
import { ROLES } from '../../src/constants/permissionRegistry.js';
import { hashPassword } from '../../src/lib/hash.js';
import { prisma } from '../../src/lib/prisma.js';
import { OnboardingService } from '../../src/services/onboarding.service.js';
import { PermissionService } from '../../src/services/permission.service.js';
import { TrackingService } from '../../src/services/tracking.service.js';
import { addDays, getThabatWeekRange, toDateKey } from '../../src/utils/week.js';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5001/api/v1';
const ADMIN_EMAIL = process.env.VERIFY_ADMIN_EMAIL ?? 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.VERIFY_ADMIN_PASSWORD ?? 'Islamic--1234';
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
      name: `Verify Week Category ${runId}`,
      description: 'Verification-only worship category',
      isActive: true,
    },
  });

  const item = await prisma.worshipItem.create({
    data: {
      categoryId: category.id,
      title: `Verify Week Item ${runId}`,
      description: 'Verification-only worship item',
      inputType: 'boolean',
      targetType: 'boolean',
      order: -Number(String(runId).slice(-8)),
      score: 1,
      xp: 1,
      isActive: true,
    },
  });

  const level = await prisma.worshipLevel.create({
    data: {
      name: `Verify Week Level ${runId}`,
      order: -Number(String(runId).slice(-8)),
      description: 'Verification-only worship level',
      isActive: true,
    },
  });

  await prisma.levelRequirement.create({
    data: {
      levelId: level.id,
      worshipItemId: item.id,
    },
  });

  return { category, item, level };
}

async function setup() {
  await PermissionService.syncRegistry();

  const [userRole, mentorRole, regionAdminRole] = await Promise.all([
    getRole(ROLES.USER),
    getRole(ROLES.MENTOR),
    getRole(ROLES.REGION_ADMIN),
  ]);

  const worship = await ensureVerificationWorshipSetup();
  const region = await prisma.region.create({
    data: {
      name: `Verify Week Region ${runId}`,
      description: 'Verification-only region',
      isActive: true,
    },
  });
  const otherRegion = await prisma.region.create({
    data: {
      name: `Verify Week Region Outside ${runId}`,
      description: 'Verification-only outside region',
      isActive: true,
    },
  });

  const regionAdmin = await createUser({
    email: `verify.week.region.admin.${runId}@example.com`,
    fullName: 'Verify Week Region Admin',
    roleId: regionAdminRole.id,
    roleCode: ROLES.REGION_ADMIN,
    regionId: region.id,
  });

  const mentor = await createUser({
    email: `verify.week.mentor.${runId}@example.com`,
    fullName: 'Verify Week Mentor',
    roleId: mentorRole.id,
    roleCode: ROLES.MENTOR,
    regionId: region.id,
  });

  const trackingUser = await createUser({
    email: `verify.week.user.${runId}@example.com`,
    fullName: 'Verify Week User',
    roleId: userRole.id,
    roleCode: ROLES.USER,
    regionId: region.id,
  });

  const assignedUser = await createUser({
    email: `verify.week.assigned.${runId}@example.com`,
    fullName: 'Verify Week Assigned User',
    roleId: userRole.id,
    roleCode: ROLES.USER,
    regionId: region.id,
  });

  const unassignedUser = await createUser({
    email: `verify.week.unassigned.${runId}@example.com`,
    fullName: 'Verify Week Unassigned User',
    roleId: userRole.id,
    roleCode: ROLES.USER,
    regionId: region.id,
  });

  const outsideRegionUser = await createUser({
    email: `verify.week.outside.region.${runId}@example.com`,
    fullName: 'Verify Week Outside Region User',
    roleId: userRole.id,
    roleCode: ROLES.USER,
    regionId: otherRegion.id,
  });

  await prisma.mentorAssignment.create({
    data: {
      mentorId: mentor.id,
      userId: assignedUser.id,
      isActive: true,
    },
  });

  return {
    region,
    otherRegion,
    worship,
    users: { regionAdmin, mentor, trackingUser, assignedUser, unassignedUser, outsideRegionUser },
  };
}

async function cleanupVerificationData() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        startsWith: 'verify.week.',
        endsWith: `.${runId}@example.com`,
      },
    },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);

  const regions = await prisma.region.findMany({
    where: {
      name: {
        startsWith: 'Verify Week Region ',
        contains: String(runId),
      },
    },
    select: { id: true },
  });
  const regionIds = regions.map((region) => region.id);

  const levels = await prisma.worshipLevel.findMany({
    where: {
      name: {
        startsWith: 'Verify Week Level ',
        contains: String(runId),
      },
    },
    select: { id: true },
  });
  const levelIds = levels.map((level) => level.id);

  const items = await prisma.worshipItem.findMany({
    where: {
      title: {
        startsWith: 'Verify Week Item ',
        contains: String(runId),
      },
    },
    select: { id: true },
  });
  const itemIds = items.map((item) => item.id);

  const categories = await prisma.worshipCategory.findMany({
    where: {
      name: {
        startsWith: 'Verify Week Category ',
        contains: String(runId),
      },
    },
    select: { id: true },
  });
  const categoryIds = categories.map((category) => category.id);

  const trackingDays = await prisma.trackingDay.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const trackingDayIds = trackingDays.map((day) => day.id);

  const [
    trackingEntries,
    trackingDayDelete,
    xpTransactions,
    userAchievements,
    userBadges,
    mentorAssignments,
    userLevels,
    usersDelete,
    levelRequirements,
    worshipItemsDelete,
    worshipLevelsDelete,
    worshipCategoriesDelete,
    regionsDelete,
  ] = await prisma.$transaction([
    prisma.trackingEntry.deleteMany({ where: { trackingDayId: { in: trackingDayIds } } }),
    prisma.trackingDay.deleteMany({ where: { id: { in: trackingDayIds } } }),
    prisma.xPTransaction.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.userAchievement.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.userBadge.deleteMany({ where: { userId: { in: userIds } } }),
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
    `Cleanup removed trackingEntries=${trackingEntries.count}, trackingDays=${trackingDayDelete.count}, xpTransactions=${xpTransactions.count}, userAchievements=${userAchievements.count}, userBadges=${userBadges.count}, mentorAssignments=${mentorAssignments.count}, userLevels=${userLevels.count}, users=${usersDelete.count}, levelRequirements=${levelRequirements.count}, worshipItems=${worshipItemsDelete.count}, worshipLevels=${worshipLevelsDelete.count}, worshipCategories=${worshipCategoriesDelete.count}, regions=${regionsDelete.count}`,
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
  log('Week Closure verification started');
  log(`API_BASE_URL=${API_BASE_URL}`);

  const context = await setup();
  const superToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  const regionAdminToken = await login(context.users.regionAdmin.email, TEST_PASSWORD);
  const mentorToken = await login(context.users.mentor.email, TEST_PASSWORD);
  const userToken = await login(context.users.trackingUser.email, TEST_PASSWORD);

  const readiness = await OnboardingService.resolveTodayWorshipReadiness(context.users.trackingUser.id);
  assert(readiness.ready, `tracking user readiness failed: ${readiness.reason}`);
  const worshipItemId = readiness.items[0].id;
  const currentWeek = getThabatWeekRange(context.users.trackingUser.timezone);
  const pastDate = addDays(currentWeek.weekStartDate, -7);
  const pastWeek = getThabatWeekRange(context.users.trackingUser.timezone, pastDate);
  const missingPastDate = addDays(pastDate, 1);

  await prisma.trackingDay.create({
    data: {
      userId: context.users.trackingUser.id,
      date: pastDate,
      status: 'OPEN',
    },
  });

  await pass('1. Current open week write succeeds through HTTP /tracking/today', async () => {
    const response = await request('/tracking/today', {
      method: 'POST',
      token: userToken,
      body: {
        entries: [
          {
            worshipItemId,
            isCompleted: true,
          },
        ],
      },
    });

    assert(response.status === 200, `expected 200, got ${response.status}`);
    assert(response.payload.data.trackingDay.status === 'OPEN', `expected OPEN, got ${response.payload.data.trackingDay.status}`);
    return `status=${response.status}, trackingDayId=${response.payload.data.trackingDay.id}`;
  });

  await pass('2. Service-layer past closed-week write is rejected with WEEK_CLOSED', async () => {
    log('NOTE: Testing TrackingService directly — no HTTP endpoint currently allows writing to a past date.');

    try {
      await TrackingService.submitTrackingForDate(context.users.trackingUser.id, context.users.trackingUser.timezone, pastDate, [
        {
          worshipItemId,
          isCompleted: true,
        },
      ]);
    } catch (error) {
      assert(error.code === 'WEEK_CLOSED', `expected WEEK_CLOSED, got ${error.code}`);
      return `code=${error.code}, date=${toDateKey(pastDate)}`;
    }

    throw new Error('expected TrackingService.submitTrackingForDate to reject closed week');
  });

  await pass('3. History endpoint returns current open-week status', async () => {
    const response = await request(`/tracking/history?weekStartDate=${currentWeek.weekStartKey}`, {
      token: userToken,
    });

    assert(response.status === 200, `expected 200, got ${response.status}`);
    assert(response.payload.data.week.isClosed === false, 'expected current week to be open');
    return `status=${response.status}, isClosed=${response.payload.data.week.isClosed}, days=${response.payload.data.days.length}`;
  });

  await pass('4. History endpoint returns past closed-week status', async () => {
    const response = await request(`/tracking/history?weekStartDate=${pastWeek.weekStartKey}`, {
      token: userToken,
    });

    assert(response.status === 200, `expected 200, got ${response.status}`);
    assert(response.payload.data.week.isClosed === true, 'expected past week to be closed');
    return `status=${response.status}, isClosed=${response.payload.data.week.isClosed}, weekStart=${response.payload.data.week.weekStartDate}`;
  });

  await pass('5. Mentor cannot view history for an unassigned user', async () => {
    const response = await request(`/tracking/history?userId=${context.users.unassignedUser.id}&weekStartDate=${currentWeek.weekStartKey}`, {
      token: mentorToken,
    });

    assert(response.status === 403, `expected 403, got ${response.status}`);
    return `status=${response.status}, code=${response.payload?.error?.code}`;
  });

  await pass('6. Mentor can view history for an assigned user', async () => {
    const response = await request(`/tracking/history?userId=${context.users.assignedUser.id}&weekStartDate=${currentWeek.weekStartKey}`, {
      token: mentorToken,
    });

    assert(response.status === 200, `expected 200, got ${response.status}`);
    return `status=${response.status}, userId=${response.payload.data.user.id}`;
  });

  await pass('7. Region Admin can view history for own-region user', async () => {
    const response = await request(`/tracking/history?userId=${context.users.trackingUser.id}&weekStartDate=${currentWeek.weekStartKey}`, {
      token: regionAdminToken,
    });

    assert(response.status === 200, `expected 200, got ${response.status}`);
    return `status=${response.status}, userId=${response.payload.data.user.id}`;
  });

  await pass('8. Region Admin cannot view history for outside-region user', async () => {
    const response = await request(`/tracking/history?userId=${context.users.outsideRegionUser.id}&weekStartDate=${currentWeek.weekStartKey}`, {
      token: regionAdminToken,
    });

    assert(response.status === 403, `expected 403, got ${response.status}`);
    return `status=${response.status}, code=${response.payload?.error?.code}`;
  });

  await pass('9. Non-Super-Admin attempting reopen gets 403', async () => {
    const response = await request(`/admin/tracking/weeks/${pastWeek.weekStartKey}/reopen`, {
      method: 'POST',
      token: regionAdminToken,
      body: {
        userId: context.users.trackingUser.id,
      },
    });

    assert(response.status === 403, `expected 403, got ${response.status}`);
    return `status=${response.status}, code=${response.payload?.error?.code}`;
  });

  await pass('10. Super Admin reopen makes the previously rejected service-layer write succeed', async () => {
    const reopenResponse = await request(`/admin/tracking/weeks/${pastWeek.weekStartKey}/reopen`, {
      method: 'POST',
      token: superToken,
      body: {
        userId: context.users.trackingUser.id,
      },
    });

    assert(reopenResponse.status === 200, `expected reopen 200, got ${reopenResponse.status}`);
    assert(reopenResponse.payload.data.reopenedDays >= 1, `expected at least 1 reopened day, got ${reopenResponse.payload.data.reopenedDays}`);

    const result = await TrackingService.submitTrackingForDate(context.users.trackingUser.id, context.users.trackingUser.timezone, pastDate, [
      {
        worshipItemId,
        isCompleted: false,
      },
    ]);

    assert(result.trackingDay.status === 'REOPENED', `expected REOPENED, got ${result.trackingDay.status}`);
    return `reopenStatus=${reopenResponse.status}, reopenedDays=${reopenResponse.payload.data.reopenedDays}, serviceWriteStatus=${result.trackingDay.status}`;
  });

  await pass('11. Reopened week allows writing to a previously missing TrackingDay date', async () => {
    const missingDayBeforeWrite = await prisma.trackingDay.findUnique({
      where: {
        userId_date: {
          userId: context.users.trackingUser.id,
          date: missingPastDate,
        },
      },
      select: { id: true, status: true },
    });

    assert(missingDayBeforeWrite?.status === 'REOPENED', `expected missing day to be pre-created as REOPENED, got ${missingDayBeforeWrite?.status}`);

    const result = await TrackingService.submitTrackingForDate(context.users.trackingUser.id, context.users.trackingUser.timezone, missingPastDate, [
      {
        worshipItemId,
        isCompleted: false,
      },
    ]);

    assert(result.trackingDay.status === 'REOPENED', `expected REOPENED, got ${result.trackingDay.status}`);
    return `date=${toDateKey(missingPastDate)}, preCreatedStatus=${missingDayBeforeWrite.status}, serviceWriteStatus=${result.trackingDay.status}`;
  });

  await pass('12. History endpoint shows reopened past week as writable', async () => {
    const response = await request(`/tracking/history?weekStartDate=${pastWeek.weekStartKey}`, {
      token: userToken,
    });

    assert(response.status === 200, `expected 200, got ${response.status}`);
    assert(response.payload.data.week.status === 'REOPENED', `expected week status REOPENED, got ${response.payload.data.week.status}`);
    assert(response.payload.data.week.isClosed === false, 'expected reopened week isClosed=false');
    const reopenedDay = response.payload.data.days.find((day) => day.status === 'REOPENED');
    assert(reopenedDay, 'expected at least one REOPENED day');
    assert(reopenedDay.isClosed === false, 'expected reopened day isClosed=false');
    return `status=${response.status}, weekStatus=${response.payload.data.week.status}, isClosed=${response.payload.data.week.isClosed}, dayStatus=${reopenedDay.status}`;
  });

  await cleanupVerificationData();

  log('Week Closure verification completed successfully');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
