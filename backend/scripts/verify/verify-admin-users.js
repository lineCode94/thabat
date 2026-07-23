import 'dotenv/config';

import { ONBOARDING_STATUS } from '../../src/constants/onboarding.js';
import { ROLES } from '../../src/constants/permissionRegistry.js';
import { hashPassword } from '../../src/lib/hash.js';
import { prisma } from '../../src/lib/prisma.js';
import { PermissionService } from '../../src/services/permission.service.js';
import { OnboardingService } from '../../src/services/onboarding.service.js';

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

async function createRegion(name) {
  return prisma.region.create({
    data: {
      name,
      description: `Verification region ${name}`,
      isActive: true,
    },
  });
}

async function createUser({ email, fullName, roleId, regionId }) {
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

  if (user.role.code === ROLES.USER) {
    await OnboardingService.createNormalUserOnboarding({ userId: user.id });
  }

  return user;
}

async function setup() {
  await PermissionService.syncRegistry();

  const [userRole, regionAdminRole, superAdminRole] = await Promise.all([
    getRole(ROLES.USER),
    getRole(ROLES.REGION_ADMIN),
    getRole(ROLES.SUPER_ADMIN),
  ]);

  const [ownRegion, otherRegion] = await Promise.all([
    createRegion(`Verify Admin Own ${runId}`),
    createRegion(`Verify Admin Other ${runId}`),
  ]);

  const regionAdmin = await createUser({
    email: `verify.region.admin.${runId}@example.com`,
    fullName: 'Verify Region Admin',
    roleId: regionAdminRole.id,
    regionId: ownRegion.id,
  });

  const outsideUser = await createUser({
    email: `verify.outside.user.${runId}@example.com`,
    fullName: 'Verify Outside User',
    roleId: userRole.id,
    regionId: otherRegion.id,
  });

  return {
    roles: { userRole, regionAdminRole, superAdminRole },
    regions: { ownRegion, otherRegion },
    users: { regionAdmin, outsideUser },
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
      startsWith: 'Verify Admin ',
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
  log(`Admin Users verification started`);
  log(`API_BASE_URL=${API_BASE_URL}`);

  const context = await setup();
  const superToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  const regionToken = await login(context.users.regionAdmin.email, TEST_PASSWORD);

  await pass('1. Super Admin creates USER with ACTIVE onboarding and UserLevel', async () => {
    const response = await request('/admin/users', {
      method: 'POST',
      token: superToken,
      body: {
        fullName: 'Verify Super Created User',
        email: `verify.super.created.${runId}@example.com`,
        password: TEST_PASSWORD,
        roleId: context.roles.userRole.id,
        regionId: context.regions.ownRegion.id,
      },
    });

    assert(response.status === 201, `expected 201, got ${response.status}`);
    const user = response.payload.data;
    assert(user.onboardingStatus === ONBOARDING_STATUS.ACTIVE, `expected ACTIVE, got ${user.onboardingStatus}`);
    assert(Array.isArray(user.userLevels) && user.userLevels.length > 0, 'expected at least one active UserLevel');
    return `status=${response.status}, userId=${user.id}, onboardingStatus=${user.onboardingStatus}, userLevels=${user.userLevels.length}`;
  });

  await pass('2. Region Admin creates USER in own region', async () => {
    const response = await request('/admin/users', {
      method: 'POST',
      token: regionToken,
      body: {
        fullName: 'Verify Region Created User',
        email: `verify.region.created.${runId}@example.com`,
        password: TEST_PASSWORD,
        roleId: context.roles.userRole.id,
        regionId: context.regions.ownRegion.id,
      },
    });

    assert(response.status === 201, `expected 201, got ${response.status}`);
    assert(response.payload.data.regionId === context.regions.ownRegion.id, 'expected own region');
    return `status=${response.status}, userId=${response.payload.data.id}, regionId=${response.payload.data.regionId}`;
  });

  await pass('3. Region Admin cannot create USER in different region', async () => {
    const response = await request('/admin/users', {
      method: 'POST',
      token: regionToken,
      body: {
        fullName: 'Verify Wrong Region User',
        email: `verify.wrong.region.${runId}@example.com`,
        password: TEST_PASSWORD,
        roleId: context.roles.userRole.id,
        regionId: context.regions.otherRegion.id,
      },
    });

    assert(response.status === 403, `expected 403, got ${response.status}`);
    return `status=${response.status}, code=${response.payload?.error?.code}`;
  });

  await pass('4. Region Admin cannot create REGION_ADMIN user', async () => {
    const response = await request('/admin/users', {
      method: 'POST',
      token: regionToken,
      body: {
        fullName: 'Verify Unsafe Region Admin',
        email: `verify.unsafe.region.admin.${runId}@example.com`,
        password: TEST_PASSWORD,
        roleId: context.roles.regionAdminRole.id,
        regionId: context.regions.ownRegion.id,
      },
    });

    assert(response.status === 403, `expected 403, got ${response.status}`);
    return `status=${response.status}, code=${response.payload?.error?.code}`;
  });

  await pass('5. Region Admin cannot update user outside own region', async () => {
    const response = await request(`/admin/users/${context.users.outsideUser.id}`, {
      method: 'PUT',
      token: regionToken,
      body: { fullName: 'Should Not Update' },
    });

    assert(response.status === 403, `expected 403, got ${response.status}`);
    return `status=${response.status}, code=${response.payload?.error?.code}`;
  });

  await pass('6. Super Admin can promote USER to REGION_ADMIN', async () => {
    const target = await createUser({
      email: `verify.promote.target.${runId}@example.com`,
      fullName: 'Verify Promote Target',
      roleId: context.roles.userRole.id,
      regionId: context.regions.ownRegion.id,
    });

    const response = await request(`/admin/users/${target.id}`, {
      method: 'PUT',
      token: superToken,
      body: { roleId: context.roles.regionAdminRole.id },
    });

    assert(response.status === 200, `expected 200, got ${response.status}`);
    assert(response.payload.data.role.code === ROLES.REGION_ADMIN, `expected REGION_ADMIN, got ${response.payload.data.role.code}`);
    return `status=${response.status}, userId=${target.id}, role=${response.payload.data.role.code}`;
  });

  await cleanupVerificationData();

  log('Admin Users verification completed successfully');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
