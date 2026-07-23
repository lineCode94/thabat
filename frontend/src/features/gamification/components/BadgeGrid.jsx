import { useTranslation } from 'react-i18next';

import { translateBadgeCategory } from '../utils/badgeTranslations';

import { BadgeCard } from './BadgeCard';

export function BadgeGrid({ badges, onSelect, activeCategory, onCategoryChange }) {
  const { t } = useTranslation(['badges']);
  const categories = ['All', ...new Set(badges.map((badge) => badge.category).filter(Boolean))];
  const safeActiveCategory = categories.includes(activeCategory) ? activeCategory : 'All';
  const filtered = safeActiveCategory === 'All'
    ? badges
    : badges.filter(b => b.category === safeActiveCategory);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-center gap-2 lg:justify-start rtl:lg:justify-end">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={[
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150',
              safeActiveCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700',
            ].join(' ')}
          >
            {translateBadgeCategory(cat, t)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
          {t('noBadgesInCategory')}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filtered.map(badge => (
            <BadgeCard key={badge.key} badge={badge} onClick={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
