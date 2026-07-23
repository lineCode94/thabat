import { prisma } from '#lib/prisma.js';

export class StreakService {
  /**
   * Returns today's date (midnight UTC) adjusted for the user's local timezone.
   */
  static _getLocalDate(timezone) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    const y = parts.find(p => p.type === 'year').value;
    const m = parts.find(p => p.type === 'month').value;
    const d = parts.find(p => p.type === 'day').value;
    return new Date(`${y}-${m}-${d}T00:00:00Z`);
  }

  /**
   * Subtracts N calendar days from a given Date object (UTC midnight).
   */
  static _subtractDays(date, n) {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() - n);
    return d;
  }

  /**
   * Formats a Date to "YYYY-MM-DD" string (UTC).
   */
  static _toDateStr(date) {
    return date.toISOString().slice(0, 10);
  }

  /**
   * Returns all tracking day dates for a user as a Set of "YYYY-MM-DD" strings.
   * Only fetches dates within the relevant range for performance.
   */
  static async _getTrackingDaySet(userId, from, to) {
    const records = await prisma.trackingDay.findMany({
      where: {
        userId,
        date: { gte: from, lte: to },
      },
      select: { date: true },
    });
    return new Set(records.map(r => this._toDateStr(r.date)));
  }

  /**
   * Calculates the current streak by scanning backwards from today.
   * Per business rules: a streak is any consecutive day with ANY TrackingDay record.
   */
  static async _calculateCurrentStreak(userId, today, allDates) {
    let streak = 0;
    let cursor = new Date(today);

    // Walk backwards day by day
    while (true) {
      const dateStr = this._toDateStr(cursor);
      if (!allDates.has(dateStr)) break;
      streak++;
      cursor = this._subtractDays(cursor, 1);
    }

    return streak;
  }



  /**
   * Main method: returns the full streak summary for a user.
   */
  static async getStreakInfo(userId, timezone) {
    const today = this._getLocalDate(timezone);
    const yesterday = this._subtractDays(today, 1);

    // --- Current & longest streak ---
    // For current streak we only need to look back at most ~1000 days, but
    // we fetch all records for longest streak anyway.
    const allRecords = await prisma.trackingDay.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: 'asc' },
    });

    const allDatesSet = new Set(allRecords.map(r => this._toDateStr(r.date)));
    const longestStreak = this._calculateLongestStreakFromSet(allRecords);
    const currentStreak = await this._calculateCurrentStreak(userId, today, allDatesSet);

    // --- Streak status ---
    const trackedToday = allDatesSet.has(this._toDateStr(today));
    const trackedYesterday = allDatesSet.has(this._toDateStr(yesterday));

    let streakStatus;
    if (allDatesSet.size === 0) {
      streakStatus = 'NEW';
    } else if (trackedToday) {
      streakStatus = 'ACTIVE';
    } else if (trackedYesterday) {
      streakStatus = 'AT_RISK';
    } else {
      streakStatus = 'BROKEN';
    }

    // --- Last completed date ---
    const lastRecord = allRecords[allRecords.length - 1];
    const lastCompletedDate = lastRecord ? this._toDateStr(lastRecord.date) : null;

    // --- Weekly consistency (Mon–Sun of current local week) ---
    const dayOfWeek = today.getUTCDay(); // 0=Sun,1=Mon,...,6=Sat
    // Normalise so week starts on Monday
    const daysFromMonday = (dayOfWeek + 6) % 7;

    let weekCompletedDays = 0;
    for (let i = 0; i <= daysFromMonday; i++) {
      const d = this._subtractDays(today, i);
      if (allDatesSet.has(this._toDateStr(d))) weekCompletedDays++;
    }
    const weekTotalDays = 7;
    const weekPercentage = Math.round((weekCompletedDays / weekTotalDays) * 100);

    // --- Monthly consistency ---
    const todayLocalStr = this._toDateStr(today);
    const [year, month] = todayLocalStr.split('-').map(Number);
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    let monthCompletedDays = 0;
    for (let day = 1; day <= Number(todayLocalStr.slice(8, 10)); day++) {
      const dayStr = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (allDatesSet.has(dayStr)) monthCompletedDays++;
    }
    const monthPercentage = Math.round((monthCompletedDays / daysInMonth) * 100);

    return {
      currentStreak,
      longestStreak,
      lastCompletedDate,
      streakStatus,
      weeklyConsistency: {
        completedDays: weekCompletedDays,
        totalDays: weekTotalDays,
        percentage: weekPercentage,
      },
      monthlyConsistency: {
        completedDays: monthCompletedDays,
        totalDays: daysInMonth,
        percentage: monthPercentage,
      },
    };
  }

  /**
   * Helper to compute longest streak directly from the ordered records array
   * without hitting the database again.
   */
  static _calculateLongestStreakFromSet(orderedRecords) {
    if (orderedRecords.length === 0) return 0;
    const dates = orderedRecords.map(r => this._toDateStr(r.date));
    let longest = 1;
    let current = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        current++;
        if (current > longest) longest = current;
      } else {
        current = 1;
      }
    }
    return longest;
  }
}
