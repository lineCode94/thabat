import 'dotenv/config';

import { prisma } from '../../src/lib/prisma.js';

const PROTECTED_REGION_NAMES = new Set([
  'Global',
  'Pending Setup',
  'Development Region',
]);

function log(message) {
  console.log(message);
}

async function main() {
  log('Leftover verification data cleanup started');

  const regions = await prisma.region.findMany({
    where: {
      name: { notIn: Array.from(PROTECTED_REGION_NAMES) },
      OR: [
        { name: { startsWith: 'Verify Admin ' } },
        { name: { startsWith: 'Verify Mentor ' } },
        { description: { startsWith: 'Verification region Verify Admin ' } },
        { description: { startsWith: 'Verification region Verify Mentor ' } },
      ],
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
    orderBy: { name: 'asc' },
  });

  const regionIds = regions.map((region) => region.id);

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { startsWith: 'verify.', endsWith: '@example.com' } },
        { regionId: { in: regionIds } },
      ],
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      regionId: true,
    },
    orderBy: { email: 'asc' },
  });
  const userIds = users.map((user) => user.id);

  const assignments = await prisma.mentorAssignment.findMany({
    where: {
      OR: [
        { userId: { in: userIds } },
        { mentorId: { in: userIds } },
      ],
    },
    select: {
      id: true,
      userId: true,
      mentorId: true,
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  log(`Regions matched (${regions.length}):`);
  regions.forEach((region) => log(`- ${region.name} [${region.id}]`));

  log(`Users matched (${users.length}):`);
  users.forEach((user) => log(`- ${user.email} [${user.id}]`));

  log(`Mentor assignments matched (${assignments.length}):`);
  assignments.forEach((assignment) => {
    log(`- ${assignment.id} userId=${assignment.userId} mentorId=${assignment.mentorId} active=${assignment.isActive}`);
  });

  const [
    deletedMentorAssignments,
    deletedUserLevels,
    deletedUsers,
    deletedRegions,
  ] = await prisma.$transaction([
    prisma.mentorAssignment.deleteMany({
      where: { id: { in: assignments.map((assignment) => assignment.id) } },
    }),
    prisma.userLevel.deleteMany({
      where: { userId: { in: userIds } },
    }),
    prisma.user.deleteMany({
      where: { id: { in: userIds } },
    }),
    prisma.region.deleteMany({
      where: { id: { in: regionIds } },
    }),
  ]);

  log('Deleted counts:');
  log(`- mentorAssignments=${deletedMentorAssignments.count}`);
  log(`- userLevels=${deletedUserLevels.count}`);
  log(`- users=${deletedUsers.count}`);
  log(`- regions=${deletedRegions.count}`);

  const remainingRegions = await prisma.region.findMany({
    where: {
      name: { notIn: Array.from(PROTECTED_REGION_NAMES) },
      OR: [
        { name: { startsWith: 'Verify Admin ' } },
        { name: { startsWith: 'Verify Mentor ' } },
        { description: { startsWith: 'Verification region Verify Admin ' } },
        { description: { startsWith: 'Verification region Verify Mentor ' } },
      ],
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  log(`Remaining matching regions after cleanup: ${remainingRegions.length}`);
  remainingRegions.forEach((region) => log(`- ${region.name} [${region.id}]`));
  log('Leftover verification data cleanup completed');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
