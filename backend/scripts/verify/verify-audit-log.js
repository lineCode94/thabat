import 'dotenv/config';

import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../../src/constants/auditLog.js';
import { ONBOARDING_STATUS } from '../../src/constants/onboarding.js';
import { ROLES } from '../../src/constants/permissionRegistry.js';
import { hashPassword } from '../../src/lib/hash.js';
import { prisma } from '../../src/lib/prisma.js';
import { OnboardingService } from '../../src/services/onboarding.service.js';
import { PermissionService } from '../../src/services/permission.service.js';
import { addDays, getThabatWeekRange } from '../../src/utils/week.js';

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
      name: `Verify Audit Category ${runId}`,
      description: 'Verification-only worship category',
      isActive: true,
    },
  });

  const item = await prisma.worshipItem.create({
    data: {
      categoryId: category.id,
      title: `Verify Audit Item ${runId}`,
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
      name: `Verify Audit Level ${runId}`,
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
}

async function setup() {
  await PermissionService.syncRegistry();
  await ensureVerificationWorshipSetup();

  const [userRole, mentorRole, regionAdminRole] = await Promise.all([
    getRole(ROLES.USER),
    getRole(ROLES.MENTOR),
    getRole(ROLES.REGION_ADMIN),
  ]);

  const directRegion = await prisma.region.create({
    data: {
      name: `Verify Audit Direct Region ${runId}`,
      description: 'Verification direct region',
      isActive: true,
    },
  });

  const outsideRegion = await prisma.region.create({
    data: {
      name: `Verify Audit Outside Region ${runId}`,
      description: 'Verification outside region',
      isActive: true,
    },
  });

  const mentor = await createUser({
    email: `verify.audit.mentor.${runId}@example.com`,
    fullName: 'Verify Audit Mentor',
    roleId: mentorRole.id,
    roleCode: ROLES.MENTOR,
    regionId: directRegion.id,
  });

  const regionAdmin = await createUser({
    email: `verify.audit.region.admin.${runId}@example.com`,
    fullName: 'Verify Audit Region Admin',
    roleId: regionAdminRole.id,
    roleCode: ROLES.REGION_ADMIN,
    regionId: outsideRegion.id,
  });

  return { roles: { userRole, regionAdminRole }, regions: { directRegion, outsideRegion }, users: { mentor, regionAdmin } };
}

async function fetchAudit(token, filters) {
  const query = new URLSearchParams(filters).toString();
  return request(`/admin/audit-logs?${query}`, { token });
}

async function expectAuditLog({ token, action, targetType, targetId, actorId, expectedMetadata = {} }) {
  const response = await fetchAudit(token, { action, targetType, targetId, limit: '10' });
  assert(response.status === 200, `expected audit query 200, got ${response.status}`);
  const rows = response.payload.data ?? [];
  const row = rows.find((entry) => entry.action === action && entry.targetType === targetType && entry.targetId === targetId);

  assert(row, `Missing audit log ${action} ${targetType}:${targetId}`);
  assert(row.actorId === actorId, `expected actorId ${actorId}, got ${row.actorId}`);

  Object.entries(expectedMetadata).forEach(([key, value]) => {
    assert(row.metadata?.[key] === value, `expected metadata.${key}=${value}, got ${row.metadata?.[key]}`);
  });

  return row;
}

async function cleanupVerificationData() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        startsWith: 'verify.audit.',
        endsWith: `.${runId}@example.com`,
      },
    },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);

  const regions = await prisma.region.findMany({
    where: {
      name: {
        startsWith: 'Verify Audit ',
        contains: String(runId),
      },
    },
    select: { id: true },
  });
  const regionIds = regions.map((region) => region.id);

  const levels = await prisma.worshipLevel.findMany({
    where: {
      name: {
        startsWith: 'Verify Audit Level ',
        contains: String(runId),
      },
    },
    select: { id: true },
  });
  const levelIds = levels.map((level) => level.id);

  const items = await prisma.worshipItem.findMany({
    where: {
      title: {
        startsWith: 'Verify Audit Item ',
        contains: String(runId),
      },
    },
    select: { id: true },
  });
  const itemIds = items.map((item) => item.id);

  const categories = await prisma.worshipCategory.findMany({
    where: {
      name: {
        startsWith: 'Verify Audit Category ',
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
  log('Audit log rows were intentionally preserved because audit history is permanent.');
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
  log('Audit Log verification started');
  log(`API_BASE_URL=${API_BASE_URL}`);

  const context = await setup();
  const superToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  const regionAdminToken = await login(context.users.regionAdmin.email, TEST_PASSWORD);
  const superAdmin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL }, select: { id: true } });

  let apiRegion = null;
  let apiUser = null;
  let promotedUser = null;
  let assignment = null;

  await pass('1. Creating a region writes REGION_CREATED audit log', async () => {
    const response = await request('/regions', {
      method: 'POST',
      token: superToken,
      body: {
        name: `Verify Audit API Region ${runId}`,
        description: 'Created through audit verification',
      },
    });

    assert(response.status === 201, `expected 201, got ${response.status}`);
    apiRegion = response.payload.data;

    const audit = await expectAuditLog({
      token: superToken,
      action: AUDIT_ACTIONS.REGION_CREATED,
      targetType: AUDIT_TARGET_TYPES.REGION,
      targetId: apiRegion.id,
      actorId: superAdmin.id,
      expectedMetadata: { name: apiRegion.name },
    });

    return `regionId=${apiRegion.id}, auditId=${audit.id}`;
  });

  await pass('2. Creating a user writes USER_CREATED audit log', async () => {
    const response = await request('/admin/users', {
      method: 'POST',
      token: superToken,
      body: {
        fullName: 'Verify Audit API User',
        email: `verify.audit.api.user.${runId}@example.com`,
        password: TEST_PASSWORD,
        roleId: context.roles.userRole.id,
        regionId: context.regions.directRegion.id,
      },
    });

    assert(response.status === 201, `expected 201, got ${response.status}`);
    apiUser = response.payload.data;

    const audit = await expectAuditLog({
      token: superToken,
      action: AUDIT_ACTIONS.USER_CREATED,
      targetType: AUDIT_TARGET_TYPES.USER,
      targetId: apiUser.id,
      actorId: superAdmin.id,
      expectedMetadata: { email: apiUser.email },
    });

    return `userId=${apiUser.id}, auditId=${audit.id}`;
  });

  await pass('3. Assigning a mentor writes MENTOR_ASSIGNED audit log', async () => {
    const response = await request('/admin/mentor-assignments', {
      method: 'POST',
      token: superToken,
      body: {
        userId: apiUser.id,
        mentorId: context.users.mentor.id,
      },
    });

    assert(response.status === 201, `expected 201, got ${response.status}`);
    assignment = response.payload.data;

    const audit = await expectAuditLog({
      token: superToken,
      action: AUDIT_ACTIONS.MENTOR_ASSIGNED,
      targetType: AUDIT_TARGET_TYPES.MENTOR_ASSIGNMENT,
      targetId: assignment.id,
      actorId: superAdmin.id,
      expectedMetadata: { userId: apiUser.id, toMentorId: context.users.mentor.id },
    });

    return `assignmentId=${assignment.id}, auditId=${audit.id}`;
  });

  await pass('4. Reopening a week writes WEEK_REOPENED audit log', async () => {
    const currentWeek = getThabatWeekRange(apiUser.timezone);
    const pastDate = addDays(currentWeek.weekStartDate, -7);
    const pastWeek = getThabatWeekRange(apiUser.timezone, pastDate);

    const response = await request(`/admin/tracking/weeks/${pastWeek.weekStartKey}/reopen`, {
      method: 'POST',
      token: superToken,
      body: { userId: apiUser.id },
    });

    assert(response.status === 200, `expected 200, got ${response.status}`);

    const targetId = `${apiUser.id}:${pastWeek.weekStartKey}`;
    const audit = await expectAuditLog({
      token: superToken,
      action: AUDIT_ACTIONS.WEEK_REOPENED,
      targetType: AUDIT_TARGET_TYPES.TRACKING_WEEK,
      targetId,
      actorId: superAdmin.id,
      expectedMetadata: { userId: apiUser.id, weekStartDate: pastWeek.weekStartKey },
    });

    return `targetId=${targetId}, auditId=${audit.id}`;
  });

  await pass('5. Promoting a user to REGION_ADMIN writes ROLE_CHANGED_TO_REGION_ADMIN audit log', async () => {
    const createResponse = await request('/admin/users', {
      method: 'POST',
      token: superToken,
      body: {
        fullName: 'Verify Audit Promoted User',
        email: `verify.audit.promoted.${runId}@example.com`,
        password: TEST_PASSWORD,
        roleId: context.roles.userRole.id,
        regionId: context.regions.directRegion.id,
      },
    });

    assert(createResponse.status === 201, `expected create 201, got ${createResponse.status}`);
    promotedUser = createResponse.payload.data;

    const updateResponse = await request(`/admin/users/${promotedUser.id}`, {
      method: 'PUT',
      token: superToken,
      body: {
        roleId: context.roles.regionAdminRole.id,
      },
    });

    assert(updateResponse.status === 200, `expected update 200, got ${updateResponse.status}`);

    const audit = await expectAuditLog({
      token: superToken,
      action: AUDIT_ACTIONS.ROLE_CHANGED_TO_REGION_ADMIN,
      targetType: AUDIT_TARGET_TYPES.USER,
      targetId: promotedUser.id,
      actorId: superAdmin.id,
      expectedMetadata: {
        fromRoleId: context.roles.userRole.id,
        toRoleId: context.roles.regionAdminRole.id,
      },
    });

    return `userId=${promotedUser.id}, auditId=${audit.id}`;
  });

  await pass('6. Region Admin cannot query audit logs', async () => {
    const response = await fetchAudit(regionAdminToken, { limit: '1' });

    assert(response.status === 403, `expected 403, got ${response.status}`);
    return `status=${response.status}, code=${response.payload?.error?.code}`;
  });

  await cleanupVerificationData();

  log('Audit Log verification completed successfully');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
