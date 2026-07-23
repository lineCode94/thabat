import 'dotenv/config';

import { prisma } from '../../src/lib/prisma.js';
import { hashPassword } from '../../src/lib/hash.js';
import { MissionService } from '../../src/services/mission.service.js';
import { NotificationService } from '../../src/services/notification.service.js';
import { GamificationNotificationService } from '../../src/services/gamification-notification.service.js';
import { sendDailyReminderForUser } from '../../src/jobs/reminder.jobs.js';

const runId = Date.now();
const prefix = `verify.missions.notifications.${runId}`;
const email = `${prefix}@example.com`;
const regionName = `Verification region Missions Notifications ${runId}`;
const missionTitle = `Verify Mission Notification ${runId}`;
const badgeKey = `verify_badge_${runId}`;
const mentorNotificationKey = `verify:mentor:${runId}`;

function log(message) {
  console.log(message);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function countNotifications(userId, type, whereMetadata = {}) {
  const notifications = await prisma.notification.findMany({
    where: { userId, type },
    select: { id: true, metadata: true },
  });

  return notifications.filter((notification) =>
    Object.entries(whereMetadata).every(([key, value]) => notification.metadata?.[key] === value),
  ).length;
}

async function cleanup() {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: 'verify.missions.notifications.' } },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);

  const missions = await prisma.mission.findMany({
    where: { title: { startsWith: 'Verify Mission Notification ' } },
    select: { id: true },
  });
  const missionIds = missions.map((mission) => mission.id);

  const badges = await prisma.badge.findMany({
    where: { key: { startsWith: 'verify_badge_' } },
    select: { id: true },
  });
  const badgeIds = badges.map((badge) => badge.id);

  if (userIds.length) {
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.xPTransaction.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userAchievement.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userBadge.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.notificationPreference.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { actorId: { in: userIds } },
          { targetId: { in: [...userIds, ...missionIds] } },
        ],
      },
    });
  }

  if (userIds.length || missionIds.length) {
    await prisma.userMission.deleteMany({
      where: {
        OR: [
          ...(userIds.length ? [{ userId: { in: userIds } }] : []),
          ...(missionIds.length ? [{ missionId: { in: missionIds } }] : []),
        ],
      },
    });
  }

  if (userIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }

  if (missionIds.length) {
    await prisma.mission.deleteMany({ where: { id: { in: missionIds } } });
  }

  if (badgeIds.length) {
    await prisma.userBadge.deleteMany({ where: { badgeId: { in: badgeIds } } });
    await prisma.badge.deleteMany({ where: { id: { in: badgeIds } } });
  }

  await prisma.region.deleteMany({
    where: { name: { startsWith: 'Verification region Missions Notifications ' } },
  });
}

async function createFixture() {
  const role = await prisma.role.findUnique({ where: { code: 'USER' } });
  assert(role, 'Missing USER role');

  const region = await prisma.region.create({
    data: {
      name: regionName,
      description: 'Verification-only region for missions and notifications QA',
      isActive: true,
    },
  });

  const user = await prisma.user.create({
    data: {
      email,
      fullName: 'Verify Missions Notifications',
      passwordHash: await hashPassword('Password123'),
      roleId: role.id,
      regionId: region.id,
      onboardingStatus: 'ACTIVE',
      isActive: true,
      timezone: 'Africa/Cairo',
      notificationPreference: {
        create: {
          inApp: true,
          dailyReminders: true,
          weeklyReminders: true,
          achievements: true,
          missions: true,
          reminderTime: '00:00',
        },
      },
    },
    include: { notificationPreference: true },
  });

  const mission = await prisma.mission.create({
    data: {
      title: missionTitle,
      description: 'Verification-only mission',
      bonusXP: 25,
      isActive: true,
    },
  });

  await prisma.achievement.upsert({
    where: { name: 'First Weekly Mission' },
    create: {
      name: 'First Weekly Mission',
      description: 'Complete your first weekly mission.',
    },
    update: {},
  });

  const badge = await prisma.badge.create({
    data: {
      key: badgeKey,
      name: `Verify Badge ${runId}`,
      description: 'Verification-only badge',
      category: 'Verification',
      rarity: 'Common',
      isVisible: true,
    },
  });

  return { user, mission, badge };
}

async function main() {
  log('Missions + notifications verification started');
  await cleanup();
  const { user, mission, badge } = await createFixture();

  try {
    const firstAssignment = await MissionService.assign(mission.id, user.id);
    const secondAssignment = await MissionService.assign(mission.id, user.id);
    assert(firstAssignment.id === secondAssignment.id, 'Assigning the same mission twice should return the existing row');
    assert(
      (await countNotifications(user.id, 'MISSION_ASSIGNED', { missionId: mission.id })) === 1,
      'MISSION_ASSIGNED notification was duplicated',
    );
    log('PASS mission assignment is idempotent and creates one notification');

    const firstCompletion = await MissionService.complete(mission.id, user.id);
    const secondCompletion = await MissionService.complete(mission.id, user.id);
    assert(firstCompletion.xpAwarded === 25, 'First mission completion should award mission XP');
    assert(secondCompletion.xpAwarded === 0, 'Second mission completion should not award XP again');
    assert(
      (await countNotifications(user.id, 'MISSION_COMPLETED', { missionId: mission.id })) === 1,
      'MISSION_COMPLETED notification was duplicated',
    );
    const missionXpCount = await prisma.xPTransaction.count({
      where: { userId: user.id, sourceType: 'USER_MISSION', sourceId: firstAssignment.id },
    });
    assert(missionXpCount === 1, 'Mission XP transaction was duplicated');
    log('PASS mission completion is idempotent and awards XP once');

    assert(
      firstCompletion.newlyUnlockedAchievements?.some((achievement) => achievement.name === 'First Weekly Mission'),
      'First Weekly Mission achievement was not unlocked',
    );
    assert(
      (await countNotifications(user.id, 'ACHIEVEMENT', { achievementKey: 'First Weekly Mission' })) === 1,
      'ACHIEVEMENT notification was not created exactly once',
    );
    log('PASS mission completion unlocks achievement notification once');

    await GamificationNotificationService.notifyBadgesEarned(user.id, [badge]);
    await GamificationNotificationService.notifyBadgesEarned(user.id, [badge]);
    assert(
      (await countNotifications(user.id, 'BADGE', { badgeKey })) === 1,
      'BADGE notification was duplicated',
    );
    log('PASS badge earned notification is idempotent');

    const reminderNow = new Date('2026-07-23T10:00:00.000Z');
    const firstReminder = await sendDailyReminderForUser(user, reminderNow);
    const secondReminder = await sendDailyReminderForUser(user, reminderNow);
    assert(firstReminder, 'First daily reminder should be created');
    assert(secondReminder === null, 'Second daily reminder for same period should be skipped');
    assert(
      (await countNotifications(user.id, 'REMINDER', { periodKey: firstReminder.metadata.periodKey })) === 1,
      'REMINDER notification was duplicated',
    );
    log('PASS daily reminder notification is idempotent per day');

    await NotificationService.createUniqueNotification({
      userId: user.id,
      type: 'MENTOR',
      title: 'Mentor follow-up',
      message: 'Verification-only mentor notification',
      notificationKey: mentorNotificationKey,
      metadata: { route: '/mentor/reviews' },
    });
    await NotificationService.createUniqueNotification({
      userId: user.id,
      type: 'MENTOR',
      title: 'Mentor follow-up',
      message: 'Verification-only mentor notification',
      notificationKey: mentorNotificationKey,
      metadata: { route: '/mentor/reviews' },
    });
    assert(
      (await countNotifications(user.id, 'MENTOR', { notificationKey: mentorNotificationKey })) === 1,
      'MENTOR notification was duplicated',
    );
    log('PASS mentor notification helper prevents duplicates');

    const summary = await MissionService.getSummary(user.id, user.timezone);
    assert(summary.assigned === 1, 'Mission summary assigned count mismatch');
    assert(summary.completed === 1, 'Mission summary completed count mismatch');
    assert(summary.completedThisWeek === 1, 'Mission summary weekly count mismatch');
    assert(summary.missionXpThisMonth === 25, 'Mission summary monthly XP mismatch');
    log('PASS mission summary returns dashboard-ready weekly/monthly reward data');
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }

  log('Missions + notifications verification completed');
}

main().catch(async (error) => {
  console.error('FAIL missions + notifications verification');
  console.error(error);
  await cleanup().catch(() => {});
  await prisma.$disconnect();
  process.exit(1);
});
