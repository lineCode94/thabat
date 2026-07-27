import { PERMISSIONS, ROLES } from '../../src/constants/permissionRegistry.js';
import { QURAN_TRACK_TYPES } from '../../src/constants/quran.js';
import { hashPassword } from '../../src/lib/hash.js';
import { prisma } from '../../src/lib/prisma.js';
import { QuranService } from '../../src/services/quran.service.js';
import { TrackingService } from '../../src/services/tracking.service.js';

const runId = Date.now();
const emailBasePrefix = 'verify.quran.';
const emailPrefix = `${emailBasePrefix}${runId}`;
const passwordHash = await hashPassword('Verify--12345');
const quranPermissions = [
  PERMISSIONS.QURAN_MANAGE_SELF,
  PERMISSIONS.QURAN_VIEW_ALL,
  PERMISSIONS.QURAN_CORRECT_ALL,
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function createUser(suffix) {
  const [role, region] = await Promise.all([
    prisma.role.findUnique({ where: { code: ROLES.USER } }),
    prisma.region.findFirst({ where: { isActive: true, deletedAt: null } }),
  ]);

  if (!role || !region) {
    throw new Error('Missing active USER role or region for verification');
  }

  return prisma.user.create({
    data: {
      fullName: `Quran Verify ${suffix}`,
      email: `${emailPrefix}.${suffix}@example.com`,
      passwordHash,
      roleId: role.id,
      regionId: region.id,
      isActive: true,
      timezone: 'Africa/Cairo',
    },
    include: { role: true },
  });
}

async function cleanup() {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: emailBasePrefix } },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);

  if (userIds.length > 0) {
    await prisma.userLevel.deleteMany({ where: { userId: { in: userIds } } });
  }

  await prisma.user.deleteMany({
    where: { email: { startsWith: emailBasePrefix } },
  });
}

async function main() {
  await cleanup();

  const estimateUser = await createUser('estimate');
  const estimateSetup = await QuranService.setup(estimateUser, quranPermissions, {
    trackType: QURAN_TRACK_TYPES.MEMORIZING,
    cumulativePagesMemorized: 100,
    weeklyTargetPages: 20,
  });
  assert(
    estimateSetup.progress.estimatedMonthsToCompletion === 7,
    `Expected estimated months 7, got ${estimateSetup.progress.estimatedMonthsToCompletion}`,
  );
  const updatedTarget = await QuranService.updateWeeklyTarget(estimateUser, quranPermissions, {
    weeklyTargetPages: 42,
  });
  assert(
    updatedTarget.progress.estimatedMonthsToCompletion === 3,
    `Expected updated estimated months 3, got ${updatedTarget.progress.estimatedMonthsToCompletion}`,
  );

  const milestoneUser = await createUser('milestone');
  await QuranService.setup(milestoneUser, quranPermissions, {
    trackType: QURAN_TRACK_TYPES.MEMORIZING,
    cumulativePagesMemorized: 200,
    weeklyTargetPages: 10,
  });
  const milestoneLog = await QuranService.submitWeeklyLog(milestoneUser, quranPermissions, { amountPages: 404 });
  const milestoneKeys = milestoneLog.newlyEarnedBadges.map((badge) => badge.key);
  ['quran_memorized_10_juz', 'quran_memorized_15_juz', 'quran_memorized_20_juz', 'quran_memorized_30_juz']
    .forEach((key) => assert(milestoneKeys.includes(key), `Missing badge ${key}`));
  assert(milestoneLog.progress.trackType === QURAN_TRACK_TYPES.REVIEWING, 'Expected auto transition to REVIEWING');
  assert(milestoneLog.progress.estimatedMonthsToCompletion === null, 'Reviewing transition should remove estimate');
  assert(milestoneLog.transitionedToReviewing === true, 'Expected transitionedToReviewing flag');

  let duplicateRejected = false;
  try {
    await QuranService.submitWeeklyLog(milestoneUser, quranPermissions, { amountPages: 1 });
  } catch (error) {
    duplicateRejected = error.code === 'QURAN_WEEKLY_LOG_ALREADY_EXISTS';
  }
  assert(duplicateRejected, 'Expected duplicate weekly log to be rejected');

  const reviewUser = await createUser('review');
  const reviewSetup = await QuranService.setup(reviewUser, quranPermissions, {
    trackType: QURAN_TRACK_TYPES.REVIEWING,
    cumulativePagesMemorized: 604,
  });
  assert(reviewSetup.progress.estimatedMonthsToCompletion === null, 'Reviewing track should not show estimate');

  const correctionUser = await createUser('correction');
  await QuranService.setup(correctionUser, quranPermissions, {
    trackType: QURAN_TRACK_TYPES.MEMORIZING,
    cumulativePagesMemorized: 50,
    weeklyTargetPages: 10,
  });
  const correctionLog = await QuranService.submitWeeklyLog(correctionUser, quranPermissions, { amountPages: 10 });
  const corrected = await QuranService.correctWeeklyLog(
    milestoneUser,
    { amountPages: 20, reason: 'Verification correction' },
    correctionLog.log.id,
  );
  assert(corrected.log.amountPages === 20, 'Correction should update amount');
  assert(corrected.progress.cumulativePagesMemorized === 70, 'Correction should recalculate cumulative from baseline');
  const auditLog = await prisma.auditLog.findFirst({
    where: {
      action: 'QURAN_WEEKLY_LOG_CORRECTED',
      targetId: correctionLog.log.id,
    },
  });
  assert(Boolean(auditLog), 'Expected audit log for correction');

  const trackingUser = await createUser('tracking');
  const today = await TrackingService.getTodayTracking(trackingUser.id, trackingUser.timezone);
  const dailyQuranTitles = new Set(['قراءة الورد/حزب', 'تسميع القرآن']);
  const hasRemovedDailyQuran = (today.items ?? []).some((item) => dailyQuranTitles.has(item.title));
  assert(!hasRemovedDailyQuran, 'Removed Quran items should not appear in daily tracking');

  await cleanup();

  console.log(JSON.stringify({
    estimateMonths: estimateSetup.progress.estimatedMonthsToCompletion,
    updatedTargetEstimateMonths: updatedTarget.progress.estimatedMonthsToCompletion,
    milestoneBadges: milestoneKeys,
    transitionedToReviewing: milestoneLog.transitionedToReviewing,
    duplicateRejected,
    reviewingEstimate: reviewSetup.progress.estimatedMonthsToCompletion,
    correctedCumulativePages: corrected.progress.cumulativePagesMemorized,
    auditLogged: Boolean(auditLog),
    dailyQuranRemoved: !hasRemovedDailyQuran,
  }, null, 2));
}

main()
  .catch(async (error) => {
    await cleanup();
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
