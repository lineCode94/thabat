export const QURAN_TRACK_TYPES = {
  MEMORIZING: 'MEMORIZING',
  REVIEWING: 'REVIEWING',
};

export const QURAN_TOTAL_PAGES = 604;
export const WEEKS_PER_MONTH = 4;

export const QURAN_PAGE_MILESTONES = {
  MEMORIZED_10_JUZ: Math.ceil((10 / 30) * QURAN_TOTAL_PAGES),
  MEMORIZED_15_JUZ: Math.ceil((15 / 30) * QURAN_TOTAL_PAGES),
  MEMORIZED_20_JUZ: Math.ceil((20 / 30) * QURAN_TOTAL_PAGES),
  MEMORIZED_30_JUZ: QURAN_TOTAL_PAGES,
};

export const QURAN_BADGES = {
  WEEKLY_CONSISTENCY: 'quran_weekly_consistency',
  MEMORIZED_10_JUZ: 'quran_memorized_10_juz',
  MEMORIZED_15_JUZ: 'quran_memorized_15_juz',
  MEMORIZED_20_JUZ: 'quran_memorized_20_juz',
  MEMORIZED_30_JUZ: 'quran_memorized_30_juz',
};
