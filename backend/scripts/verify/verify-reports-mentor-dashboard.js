import 'dotenv/config';

import { prisma } from '../../src/lib/prisma.js';
import { hashPassword } from '../../src/lib/hash.js';
import { ReportSummaryService } from '../../src/services/report-summary.service.js';
import { MentorDashboardService } from '../../src/services/mentor-dashboard.service.js';

const runId = Date.now();
const regionName = `Verification region Reports Mentor ${runId}`;
const userEmail = `verify.reports.mentor.user.${runId}@example.com`;
const mentorEmail = `verify.reports.mentor.${runId}@example.com`;
const today = new Date('2026-07-23T00:00:00.000Z');

function log(message) {
  console.log(message);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function cleanup() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [userEmail, mentorEmail],
      },
    },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);

  if (userIds.length) {
    await prisma.trackingDay.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userMission.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.xPTransaction.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.mentorAssignment.deleteMany({
      where: { OR: [{ userId: { in: userIds } }, { mentorId: { in: userIds } }] },
    });
    await prisma.notificationPreference.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }

  await prisma.region.deleteMany({ where: { name: regionName } });
}

async function getRole(code) {
  const role = await prisma.role.findUnique({ where: { code } });
  assert(role, `Missing role ${code}`);
  return role;
}

async function createFixture() {
  const [userRole, mentorRole] = await Promise.all([getRole('USER'), getRole('MENTOR')]);
  const region = await prisma.region.create({
    data: { name: regionName, description: 'Verification region', isActive: true },
  });
  const passwordHash = await hashPassword('Password123');
  const [mentor, user] = await Promise.all([
    prisma.user.create({
      data: {
        fullName: 'Verify Mentor Dashboard',
        email: mentorEmail,
        passwordHash,
        roleId: mentorRole.id,
        regionId: region.id,
        onboardingStatus: 'ACTIVE',
        timezone: 'Africa/Cairo',
      },
    }),
    prisma.user.create({
      data: {
        fullName: 'Verify Reports User',
        email: userEmail,
        passwordHash,
        roleId: userRole.id,
        regionId: region.id,
        onboardingStatus: 'ACTIVE',
        timezone: 'Africa/Cairo',
      },
    }),
  ]);

  await prisma.mentorAssignment.create({ data: { mentorId: mentor.id, userId: user.id } });

  const item = await prisma.worshipItem.findFirst({
    where: { deletedAt: null, isActive: true, score: { gt: 0 } },
    select: { id: true, score: true },
  });
  assert(item, 'Missing seeded worship item');

  const day = await prisma.trackingDay.create({
    data: {
      userId: user.id,
      date: today,
      trackingEntries: {
        create: {
          worshipItemId: item.id,
          isCompleted: true,
          scoreEarned: item.score,
          notes: 'Verification comment for mentor visibility',
        },
      },
    },
  });

  await prisma.xPTransaction.create({
    data: {
      userId: user.id,
      amount: 10,
      reason: 'Verification XP',
      sourceType: 'TRACKING_ENTRY',
      sourceId: day.id,
    },
  });

  return { mentor, user };
}

async function main() {
  log('Reports + mentor dashboard verification started');
  await cleanup();
  const { mentor, user } = await createFixture();

  try {
    const daily = await ReportSummaryService.getDailyReport(
      user,
      ['reports.view_own'],
      { date: '2026-07-23' },
    );
    assert(daily.totals.completedItems === 1, 'Daily report did not include completed item');
    assert(daily.totals.completedScore > 0, 'Daily report score was not calculated');
    log('PASS daily report returns worship score and XP data');

    const monthly = await ReportSummaryService.getMonthlyReport(
      user,
      ['reports.view_own'],
      { month: '2026-07' },
    );
    assert(monthly.totals.activeTrackingDays === 1, 'Monthly report active days mismatch');
    assert(monthly.bestDay?.date === '2026-07-23', 'Monthly report best day mismatch');
    log('PASS monthly report returns activity, best day, and breakdown data');

    const mentorDaily = await ReportSummaryService.getDailyReport(
      mentor,
      ['reports.view_assigned'],
      { userId: user.id, date: '2026-07-23' },
    );
    assert(mentorDaily.user.id === user.id, 'Mentor could not view assigned user daily report');
    log('PASS mentor can view assigned user report');

    const dashboard = await MentorDashboardService.getDashboard(
      mentor,
      ['reviews.manage_assigned'],
    );
    assert(dashboard.totals.assignedUsers === 1, 'Mentor dashboard assigned count mismatch');
    assert(dashboard.users[0]?.recentComments.length === 1, 'Mentor dashboard did not include tracking comments');
    log('PASS mentor dashboard returns assigned users, weak-day data, and comments');
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }

  log('Reports + mentor dashboard verification completed');
}

main().catch(async (error) => {
  console.error('FAIL reports + mentor dashboard verification');
  console.error(error);
  await cleanup().catch(() => {});
  await prisma.$disconnect();
  process.exit(1);
});
