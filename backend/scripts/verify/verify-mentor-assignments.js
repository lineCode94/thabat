import 'dotenv/config';

import { ONBOARDING_STATUS } from '../../src/constants/onboarding.js';
import { ROLES } from '../../src/constants/permissionRegistry.js';
import { hashPassword } from '../../src/lib/hash.js';
import { prisma } from '../../src/lib/prisma.js';
import { OnboardingService } from '../../src/services/onboarding.service.js';
import { PermissionService } from '../../src/services/permission.service.js';

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

async function createRegion(name) {
  return prisma.region.create({
    data: {
      name,
      description: `Verification region ${name}`,
      isActive: true,
    },
  });
}

async function createUser({ email, fullName, roleId, regionId, roleCode }) {
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

async function setup() {
  await PermissionService.syncRegistry();

  const [userRole, mentorRole, regionAdminRole] = await Promise.all([
    getRole(ROLES.USER),
    getRole(ROLES.MENTOR),
    getRole(ROLES.REGION_ADMIN),
  ]);

  const [ownRegion, otherRegion] = await Promise.all([
    createRegion(`Verify Mentor Own ${runId}`),
    createRegion(`Verify Mentor Other ${runId}`),
  ]);

  const regionAdmin = await createUser({
    email: `verify.mentor.region.admin.${runId}@example.com`,
    fullName: 'Verify Mentor Region Admin',
    roleId: regionAdminRole.id,
    roleCode: ROLES.REGION_ADMIN,
    regionId: ownRegion.id,
  });

  const mentorA = await createUser({
    email: `verify.mentor.a.${runId}@example.com`,
    fullName: 'Verify Mentor A',
    roleId: mentorRole.id,
    roleCode: ROLES.MENTOR,
    regionId: ownRegion.id,
  });

  const mentorB = await createUser({
    email: `verify.mentor.b.${runId}@example.com`,
    fullName: 'Verify Mentor B',
    roleId: mentorRole.id,
    roleCode: ROLES.MENTOR,
    regionId: ownRegion.id,
  });

  const outsideMentor = await createUser({
    email: `verify.mentor.outside.${runId}@example.com`,
    fullName: 'Verify Outside Mentor',
    roleId: mentorRole.id,
    roleCode: ROLES.MENTOR,
    regionId: otherRegion.id,
  });

  const userA = await createUser({
    email: `verify.mentor.user.a.${runId}@example.com`,
    fullName: 'Verify Mentor User A',
    roleId: userRole.id,
    roleCode: ROLES.USER,
    regionId: ownRegion.id,
  });

  const userB = await createUser({
    email: `verify.mentor.user.b.${runId}@example.com`,
    fullName: 'Verify Mentor User B',
    roleId: userRole.id,
    roleCode: ROLES.USER,
    regionId: ownRegion.id,
  });

  const userC = await createUser({
    email: `verify.mentor.user.c.${runId}@example.com`,
    fullName: 'Verify Mentor User C',
    roleId: userRole.id,
    roleCode: ROLES.USER,
    regionId: ownRegion.id,
  });

  const outsideUser = await createUser({
    email: `verify.mentor.user.outside.${runId}@example.com`,
    fullName: 'Verify Outside User',
    roleId: userRole.id,
    roleCode: ROLES.USER,
    regionId: otherRegion.id,
  });

  const normalUserAsBadMentor = await createUser({
    email: `verify.bad.mentor.${runId}@example.com`,
    fullName: 'Verify Bad Mentor',
    roleId: userRole.id,
    roleCode: ROLES.USER,
    regionId: ownRegion.id,
  });

  return {
    regions: { ownRegion, otherRegion },
    users: {
      regionAdmin,
      mentorA,
      mentorB,
      outsideMentor,
      userA,
      userB,
      userC,
      outsideUser,
      normalUserAsBadMentor,
    },
  };
}

async function cleanupVerificationData() {
  const safeUserWhere = {
    email: {
      startsWith: 'verify.',
      endsWith: `.${runId}@example.com`,
    },
  };
  const safeRegionWhere = {
    name: {
      startsWith: 'Verify Mentor ',
      contains: String(runId),
    },
  };

  const users = await prisma.user.findMany({
    where: safeUserWhere,
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);

  const [mentorAssignments, userLevels, deletedUsers, deletedRegions] = await prisma.$transaction([
    prisma.mentorAssignment.deleteMany({
      where: {
        OR: [
          { userId: { in: userIds } },
          { mentorId: { in: userIds } },
        ],
      },
    }),
    prisma.userLevel.deleteMany({
      where: { userId: { in: userIds } },
    }),
    prisma.user.deleteMany({
      where: safeUserWhere,
    }),
    prisma.region.deleteMany({
      where: safeRegionWhere,
    }),
  ]);

  log(
    `Cleanup removed mentorAssignments=${mentorAssignments.count}, userLevels=${userLevels.count}, users=${deletedUsers.count}, regions=${deletedRegions.count}`,
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
  log('Mentor Assignment verification started');
  log(`API_BASE_URL=${API_BASE_URL}`);

  const context = await setup();
  const superToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  const regionToken = await login(context.users.regionAdmin.email, TEST_PASSWORD);
  const mentorToken = await login(context.users.mentorA.email, TEST_PASSWORD);

  await pass('1. Super Admin assigns USER to MENTOR', async () => {
    const response = await request('/admin/mentor-assignments', {
      method: 'POST',
      token: superToken,
      body: {
        userId: context.users.userA.id,
        mentorId: context.users.mentorA.id,
      },
    });

    assert(response.status === 201, `expected 201, got ${response.status}`);
    assert(response.payload.data.isActive === true, 'expected active assignment');
    return `status=${response.status}, assignmentId=${response.payload.data.id}`;
  });

  await pass('2. Super Admin lists active assignments by default', async () => {
    const response = await request(`/admin/mentor-assignments?userId=${context.users.userA.id}`, {
      token: superToken,
    });

    assert(response.status === 200, `expected 200, got ${response.status}`);
    assert(response.payload.data.length === 1, `expected 1 active assignment, got ${response.payload.data.length}`);
    assert(response.payload.data.every((assignment) => assignment.isActive), 'expected only active assignments');
    return `status=${response.status}, activeCount=${response.payload.data.length}`;
  });

  await pass('3. Transfer deactivates old assignment and creates a new active row', async () => {
    const response = await request(`/admin/mentor-assignments/${context.users.userA.id}/transfer`, {
      method: 'POST',
      token: superToken,
      body: {
        mentorId: context.users.mentorB.id,
      },
    });

    assert(response.status === 201, `expected 201, got ${response.status}`);

    const [total, active] = await Promise.all([
      prisma.mentorAssignment.count({ where: { userId: context.users.userA.id } }),
      prisma.mentorAssignment.count({ where: { userId: context.users.userA.id, isActive: true } }),
    ]);

    assert(total === 2, `expected 2 history rows, got ${total}`);
    assert(active === 1, `expected 1 active row, got ${active}`);
    return `status=${response.status}, totalRows=${total}, activeRows=${active}`;
  });

  await pass('4. includeInactive=true returns assignment history', async () => {
    const response = await request(`/admin/mentor-assignments?userId=${context.users.userA.id}&includeInactive=true`, {
      token: superToken,
    });

    assert(response.status === 200, `expected 200, got ${response.status}`);
    assert(response.payload.data.length === 2, `expected 2 rows, got ${response.payload.data.length}`);
    return `status=${response.status}, historyCount=${response.payload.data.length}`;
  });

  await pass('5. Region Admin assigns own-region USER to own-region MENTOR', async () => {
    const response = await request('/admin/mentor-assignments', {
      method: 'POST',
      token: regionToken,
      body: {
        userId: context.users.userB.id,
        mentorId: context.users.mentorA.id,
      },
    });

    assert(response.status === 201, `expected 201, got ${response.status}`);
    return `status=${response.status}, assignmentId=${response.payload.data.id}`;
  });

  await pass('6. Region Admin cannot assign own user to outside-region mentor', async () => {
    const response = await request('/admin/mentor-assignments', {
      method: 'POST',
      token: regionToken,
      body: {
        userId: context.users.userC.id,
        mentorId: context.users.outsideMentor.id,
      },
    });

    assert(response.status === 403, `expected 403, got ${response.status}`);
    return `status=${response.status}, code=${response.payload?.error?.code}`;
  });

  await pass('7. Region Admin cannot assign outside-region user', async () => {
    const response = await request('/admin/mentor-assignments', {
      method: 'POST',
      token: regionToken,
      body: {
        userId: context.users.outsideUser.id,
        mentorId: context.users.mentorA.id,
      },
    });

    assert(response.status === 403, `expected 403, got ${response.status}`);
    return `status=${response.status}, code=${response.payload?.error?.code}`;
  });

  await pass('8. Cannot assign non-USER account as student', async () => {
    const response = await request('/admin/mentor-assignments', {
      method: 'POST',
      token: superToken,
      body: {
        userId: context.users.regionAdmin.id,
        mentorId: context.users.mentorA.id,
      },
    });

    assert(response.status === 400, `expected 400, got ${response.status}`);
    return `status=${response.status}, code=${response.payload?.error?.code}`;
  });

  await pass('9. Cannot assign non-MENTOR account as mentor', async () => {
    const response = await request('/admin/mentor-assignments', {
      method: 'POST',
      token: superToken,
      body: {
        userId: context.users.userC.id,
        mentorId: context.users.normalUserAsBadMentor.id,
      },
    });

    assert(response.status === 400, `expected 400, got ${response.status}`);
    return `status=${response.status}, code=${response.payload?.error?.code}`;
  });

  await pass('10. Reassigning to same active mentor returns existing assignment without duplicate', async () => {
    const response = await request('/admin/mentor-assignments', {
      method: 'POST',
      token: regionToken,
      body: {
        userId: context.users.userB.id,
        mentorId: context.users.mentorA.id,
      },
    });

    assert(response.status === 201, `expected 201, got ${response.status}`);

    const [total, active] = await Promise.all([
      prisma.mentorAssignment.count({ where: { userId: context.users.userB.id } }),
      prisma.mentorAssignment.count({ where: { userId: context.users.userB.id, isActive: true } }),
    ]);

    assert(total === 1, `expected 1 total assignment row, got ${total}`);
    assert(active === 1, `expected 1 active assignment row, got ${active}`);
    return `status=${response.status}, returnedAssignmentId=${response.payload.data.id}, totalRows=${total}, activeRows=${active}`;
  });

  await pass('11. Admin mentor list is scoped and includes activeUserCount', async () => {
    const response = await request('/admin/mentors', {
      token: regionToken,
    });

    assert(response.status === 200, `expected 200, got ${response.status}`);
    assert(response.payload.data.length >= 2, `expected at least 2 mentors, got ${response.payload.data.length}`);
    assert(response.payload.data.every((mentor) => mentor.regionId === context.regions.ownRegion.id), 'expected only own-region mentors');
    assert(response.payload.data.every((mentor) => Number.isInteger(mentor.activeUserCount)), 'expected activeUserCount on every mentor');
    return `status=${response.status}, mentors=${response.payload.data.length}, sampleCount=${response.payload.data[0].activeUserCount}`;
  });

  await pass('12. Current active assignment endpoint returns assignment for assigned user', async () => {
    const response = await request(`/admin/users/${context.users.userB.id}/mentor-assignment`, {
      token: regionToken,
    });

    assert(response.status === 200, `expected 200, got ${response.status}`);
    assert(response.payload.data?.mentorId === context.users.mentorA.id, `expected mentorA, got ${response.payload.data?.mentorId}`);
    return `status=${response.status}, assignmentId=${response.payload.data.id}, mentorId=${response.payload.data.mentorId}`;
  });

  await pass('13. Current active assignment endpoint returns null when none exists', async () => {
    const response = await request(`/admin/users/${context.users.outsideUser.id}/mentor-assignment`, {
      token: superToken,
    });

    assert(response.status === 200, `expected 200, got ${response.status}`);
    assert(response.payload.data === null, 'expected null assignment');
    return `status=${response.status}, assignment=null`;
  });

  await pass('14. Mentor can list own assigned users', async () => {
    const response = await request(`/admin/mentors/${context.users.mentorA.id}/users`, {
      token: mentorToken,
    });

    assert(response.status === 200, `expected 200, got ${response.status}`);
    assert(response.payload.data.some((user) => user.id === context.users.userB.id), 'expected own assigned userB in result');
    return `status=${response.status}, assignedUsers=${response.payload.data.length}`;
  });

  await pass('15. Mentor cannot list another mentor assigned users', async () => {
    const response = await request(`/admin/mentors/${context.users.mentorB.id}/users`, {
      token: mentorToken,
    });

    assert(response.status === 403, `expected 403, got ${response.status}`);
    return `status=${response.status}, code=${response.payload?.error?.code}`;
  });

  await pass('16. Deactivating active assignment clears current assignment', async () => {
    const createResponse = await request('/admin/mentor-assignments', {
      method: 'POST',
      token: superToken,
      body: {
        userId: context.users.userC.id,
        mentorId: context.users.mentorA.id,
      },
    });

    assert(createResponse.status === 201, `expected create 201, got ${createResponse.status}`);

    const deactivateResponse = await request(
      `/admin/mentor-assignments/${createResponse.payload.data.id}/deactivate`,
      {
        method: 'POST',
        token: superToken,
      },
    );

    assert(deactivateResponse.status === 200, `expected deactivate 200, got ${deactivateResponse.status}`);
    assert(deactivateResponse.payload.data.isActive === false, 'expected assignment to be inactive');

    const currentResponse = await request(`/admin/users/${context.users.userC.id}/mentor-assignment`, {
      token: superToken,
    });

    assert(currentResponse.status === 200, `expected current 200, got ${currentResponse.status}`);
    assert(currentResponse.payload.data === null, 'expected null current assignment after deactivation');

    return `status=${deactivateResponse.status}, assignmentId=${deactivateResponse.payload.data.id}, current=null`;
  });

  await cleanupVerificationData();

  log('Mentor Assignment verification completed successfully');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
