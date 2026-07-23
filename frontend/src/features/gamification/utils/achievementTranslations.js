export const ACHIEVEMENT_CATEGORIES = [
  'Getting Started',
  'Streak',
  'XP',
  'Prayer',
  'Quran',
  'Mission',
  'General',
];

export function translateAchievementCategory(category, t) {
  return t(`categories.${category}`, { defaultValue: category });
}

export function translateAchievementState(state, t) {
  return t(`states.${state}`, { defaultValue: state });
}

export function getAchievementDisplay(achievement, t) {
  return {
    name: t(`items.${achievement.key}.name`, { defaultValue: achievement.name }),
    description: t(`items.${achievement.key}.description`, {
      defaultValue: achievement.description,
    }),
    category: translateAchievementCategory(achievement.category, t),
    state: translateAchievementState(achievement.state, t),
  };
}
