import { useTranslation } from 'react-i18next';

import { translateAchievementCategory } from '../utils/achievementTranslations';

import { AchievementCard } from './AchievementCard';

const CATEGORY_ORDER = ['Getting Started', 'Streak', 'XP', 'Prayer', 'Quran', 'Mission'];

function groupByCategory(achievements) {
  const groups = {};
  for (const a of achievements) {
    if (!groups[a.category]) groups[a.category] = [];
    groups[a.category].push(a);
  }
  return groups;
}

export function AchievementGrid({ achievements, onSelect }) {
  const { t } = useTranslation(['achievements']);
  const groups = groupByCategory(achievements);
  const orderedCategories = [
    ...CATEGORY_ORDER.filter(c => groups[c]),
    ...Object.keys(groups).filter(c => !CATEGORY_ORDER.includes(c)),
  ];

  return (
    <div className="space-y-8">
      {orderedCategories.map(category => (
        <div key={category}>
          <h2 className="text-base font-semibold text-slate-600 dark:text-slate-300 mb-3 px-1">
            {translateAchievementCategory(category, t)}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups[category].map(a => (
              <AchievementCard key={a.key} achievement={a} onClick={onSelect} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
