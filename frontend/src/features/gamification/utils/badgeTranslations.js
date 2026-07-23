export const BADGE_CATEGORIES = [
  'All',
  'Prayer',
  'Quran',
  'Streak',
  'XP',
  'Missions',
  'Levels',
  'Mentor',
  'Special Events',
];

export function translateBadgeCategory(category, t) {
  return t(`categories.${category}`, { defaultValue: category });
}

export function translateBadgeRarity(rarity, t) {
  return t(`rarities.${rarity}`, { defaultValue: rarity });
}

export function getBadgeDisplay(badge, t) {
  return {
    name: t(`items.${badge.key}.name`, { defaultValue: badge.name }),
    description: t(`items.${badge.key}.description`, {
      defaultValue: badge.description ?? t('defaultDescription'),
    }),
    category: translateBadgeCategory(badge.category, t),
    rarity: translateBadgeRarity(badge.rarity, t),
  };
}
