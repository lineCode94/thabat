import { logger } from '#lib/logger.js';
import { prisma } from '#lib/prisma.js';
import { NotificationService } from '#services/notification.service.js';
import { WeeklyReportService } from '#services/weekly-report.service.js';
import { addDays, getThabatDateForTimezone, getThabatWeekRange, toDateKey } from '#utils/week.js';

const DEFAULT_TIMEZONE = 'Africa/Cairo';
const DAILY_REMINDER_TYPE = 'REMINDER';
const WEEKLY_REMINDER_TYPE = 'WEEKLY_REMINDER';
const DAILY_JOB_INTERVAL_MS = 10 * 60 * 1000;
const WEEKLY_JOB_INTERVAL_MS = 60 * 60 * 1000;
const DEFAULT_PREFERENCE = {
  inApp: true,
  dailyReminders: true,
  weeklyReminders: true,
  reminderTime: '07:30',
  quietHoursStart: null,
  quietHoursEnd: null,
};

let dailyReminderTimer = null;
let weeklyReminderTimer = null;
let dailyJobRunning = false;
let weeklyJobRunning = false;

function getLocalTimeParts(timezone = DEFAULT_TIMEZONE, date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone || DEFAULT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(date);

  return {
    hour: Number(parts.find((part) => part.type === 'hour')?.value ?? 0),
    minute: Number(parts.find((part) => part.type === 'minute')?.value ?? 0),
  };
}

function parseTimeToMinutes(value) {
  const [hour = '0', minute = '0'] = String(value ?? '07:30').split(':');
  return (Number(hour) * 60) + Number(minute);
}

function isAfterConfiguredReminderTime(preference, timezone, now = new Date()) {
  const { hour, minute } = getLocalTimeParts(timezone, now);
  const currentMinutes = (hour * 60) + minute;
  const reminderMinutes = parseTimeToMinutes(preference.reminderTime);

  return currentMinutes >= reminderMinutes;
}

function isWithinQuietHours(preference, timezone, now = new Date()) {
  if (!preference.quietHoursStart || !preference.quietHoursEnd) return false;

  const { hour, minute } = getLocalTimeParts(timezone, now);
  const current = (hour * 60) + minute;
  const start = parseTimeToMinutes(preference.quietHoursStart);
  const end = parseTimeToMinutes(preference.quietHoursEnd);

  if (start === end) return false;
  if (start < end) return current >= start && current < end;

  return current >= start || current < end;
}

async function hasNotificationForPeriod(userId, type, periodKey) {
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type,
      metadata: {
        path: ['periodKey'],
        equals: periodKey,
      },
    },
    select: { id: true },
  });

  return Boolean(existing);
}

async function hasCompletedTrackingForDate(userId, date) {
  const completedEntry = await prisma.trackingEntry.findFirst({
    where: {
      isCompleted: true,
      trackingDay: {
        userId,
        date,
      },
    },
    select: { id: true },
  });

  return Boolean(completedEntry);
}

async function getReminderUsers() {
  return prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      onboardingStatus: 'ACTIVE',
    },
    select: {
      id: true,
      fullName: true,
      timezone: true,
      notificationPreference: true,
    },
  });
}

export async function sendDailyReminderForUser(user, now = new Date()) {
  const preference = user.notificationPreference ?? DEFAULT_PREFERENCE;
  if (!preference?.inApp || !preference.dailyReminders) return null;

  const timezone = user.timezone || DEFAULT_TIMEZONE;
  if (!isAfterConfiguredReminderTime(preference, timezone, now)) return null;
  if (isWithinQuietHours(preference, timezone, now)) return null;

  const today = getThabatDateForTimezone(timezone, now);
  const periodKey = toDateKey(today);
  const [alreadySent, completedToday] = await Promise.all([
    hasNotificationForPeriod(user.id, DAILY_REMINDER_TYPE, periodKey),
    hasCompletedTrackingForDate(user.id, today),
  ]);

  if (alreadySent || completedToday) return null;

  return NotificationService.createNotification({
    userId: user.id,
    title: '\u062a\u0630\u0643\u064a\u0631 \u0639\u0628\u0627\u062f\u0629 \u0627\u0644\u064a\u0648\u0645',
    message: '\u0644\u0633\u0647 \u0641\u064a \u0641\u0631\u0635\u0629 \u062a\u0643\u0645\u0644 \u0645\u062a\u0627\u0628\u0639\u0629 \u0639\u0628\u0627\u062f\u0629 \u0627\u0644\u064a\u0648\u0645 \u0648\u062a\u062b\u0628\u062a \u062e\u0637\u0648\u062a\u0643.',
    type: DAILY_REMINDER_TYPE,
    priority: 'MEDIUM',
    metadata: {
      periodKey,
      date: periodKey,
      route: '/tracking',
    },
  });
}

export async function runDailyReminderJob(now = new Date()) {
  if (dailyJobRunning) return { skipped: true, reason: 'already_running' };
  dailyJobRunning = true;

  try {
    const users = await getReminderUsers();
    let sent = 0;

    for (const user of users) {
      const notification = await sendDailyReminderForUser(user, now);
      if (notification) sent += 1;
    }

    logger.info({ sent }, 'Daily reminder job completed');
    return { sent };
  } catch (error) {
    logger.error({ err: error }, 'Daily reminder job failed');
    throw error;
  } finally {
    dailyJobRunning = false;
  }
}

export async function runWeeklyReminderJob(now = new Date()) {
  if (weeklyJobRunning) return { skipped: true, reason: 'already_running' };
  weeklyJobRunning = true;

  try {
    const users = await getReminderUsers();
    let sent = 0;

    for (const user of users) {
      const preference = user.notificationPreference ?? DEFAULT_PREFERENCE;
      if (!preference?.inApp || !preference.weeklyReminders) continue;

      const timezone = user.timezone || DEFAULT_TIMEZONE;
      if (isWithinQuietHours(preference, timezone, now)) continue;

      const previousWeek = getThabatWeekRange(timezone, addDays(now, -7), {
        applyDayBoundary: false,
      });
      if (previousWeek.weekEndDateTime.getTime() >= now.getTime()) continue;

      const periodKey = previousWeek.weekStartKey;
      const alreadySent = await hasNotificationForPeriod(user.id, WEEKLY_REMINDER_TYPE, periodKey);
      if (alreadySent) continue;

      let reportResult = null;
      try {
        reportResult = await WeeklyReportService.getWeeklyReport(
          user,
          ['reports.view_own'],
          { userId: user.id, weekStartDate: periodKey },
        );
      } catch (error) {
        if (error.code === 'WEEK_NOT_CLOSED') continue;
        throw error;
      }

      const totals = reportResult?.report?.data?.totals ?? {};
      const notification = await NotificationService.createNotification({
        userId: user.id,
        title: 'ملخص الأسبوع جاهز',
        message: `ثبات الأسبوع: ${totals.consistencyPercentage ?? 0}%، والنقاط: ${totals.xpEarned ?? 0}.`,
        type: WEEKLY_REMINDER_TYPE,
        priority: 'MEDIUM',
        metadata: {
          periodKey,
          weekStartDate: previousWeek.weekStartKey,
          weekEndDate: previousWeek.weekEndKey,
          reportId: reportResult?.report?.id,
          route: '/reports/weekly',
        },
      });

      if (notification) sent += 1;
    }

    logger.info({ sent }, 'Weekly reminder job completed');
    return { sent };
  } catch (error) {
    logger.error({ err: error }, 'Weekly reminder job failed');
    throw error;
  } finally {
    weeklyJobRunning = false;
  }
}

export function startReminderJobs() {
  if (dailyReminderTimer || weeklyReminderTimer) {
    return;
  }

  void runDailyReminderJob().catch(() => {});
  void runWeeklyReminderJob().catch(() => {});

  dailyReminderTimer = setInterval(() => {
    void runDailyReminderJob().catch(() => {});
  }, DAILY_JOB_INTERVAL_MS);

  weeklyReminderTimer = setInterval(() => {
    void runWeeklyReminderJob().catch(() => {});
  }, WEEKLY_JOB_INTERVAL_MS);

  logger.info('Reminder jobs started');
}

export function stopReminderJobs() {
  if (dailyReminderTimer) {
    clearInterval(dailyReminderTimer);
    dailyReminderTimer = null;
  }

  if (weeklyReminderTimer) {
    clearInterval(weeklyReminderTimer);
    weeklyReminderTimer = null;
  }

  logger.info('Reminder jobs stopped');
}
