const DEFAULT_TIMEZONE = 'Africa/Cairo';
const THABAT_DAY_START_HOUR = 5;

function getLocalDateParts(timezone = DEFAULT_TIMEZONE, date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || DEFAULT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(date);

  return {
    year: parts.find((part) => part.type === 'year')?.value,
    month: parts.find((part) => part.type === 'month')?.value,
    day: parts.find((part) => part.type === 'day')?.value,
    hour: Number(parts.find((part) => part.type === 'hour')?.value ?? 0),
  };
}

export function getLocalDateForTimezone(timezone = DEFAULT_TIMEZONE, date = new Date()) {
  const { year, month, day } = getLocalDateParts(timezone, date);

  return new Date(`${year}-${month}-${day}T00:00:00Z`);
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

export function getThabatDateForTimezone(timezone = DEFAULT_TIMEZONE, date = new Date()) {
  const { year, month, day, hour } = getLocalDateParts(timezone, date);
  const localDate = new Date(`${year}-${month}-${day}T00:00:00Z`);

  return hour < THABAT_DAY_START_HOUR ? addDays(localDate, -1) : localDate;
}

export function getThabatWeekRange(timezone = DEFAULT_TIMEZONE, date = new Date(), options = {}) {
  const { applyDayBoundary = true } = options;
  const localDate = applyDayBoundary
    ? getThabatDateForTimezone(timezone, date)
    : getLocalDateForTimezone(timezone, date);
  const dayOfWeek = localDate.getUTCDay();
  const daysSinceSaturday = (dayOfWeek + 1) % 7;
  const weekStartDate = addDays(localDate, -daysSinceSaturday);
  const weekEndDate = addDays(weekStartDate, 6);
  const weekEndDateTime = new Date(weekEndDate);
  weekEndDateTime.setUTCHours(23, 59, 59, 999);

  return {
    weekStartDate,
    weekEndDate,
    weekEndDateTime,
    weekStartKey: toDateKey(weekStartDate),
    weekEndKey: toDateKey(weekEndDate),
  };
}
