import { motion } from 'framer-motion';
import { Lock, Medal, Star, Trophy, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getBadgeDisplay, translateBadgeRarity } from '../utils/badgeTranslations';

// ---------------------------------------------------------------------------
// Rarity config — colours & icons
// ---------------------------------------------------------------------------
const RARITY_CONFIG = {
  Common: {
    label: 'Common',
    gradient: 'from-slate-400 to-slate-500',
    border: 'border-slate-300 dark:border-slate-600',
    glow: '',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    icon: Medal,
  },
  Rare: {
    label: 'Rare',
    gradient: 'from-blue-500 to-indigo-600',
    border: 'border-blue-300 dark:border-blue-600',
    glow: 'shadow-blue-200 dark:shadow-blue-900',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    icon: Star,
  },
  Epic: {
    label: 'Epic',
    gradient: 'from-purple-500 to-fuchsia-600',
    border: 'border-purple-300 dark:border-purple-600',
    glow: 'shadow-purple-200 dark:shadow-purple-900',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    icon: Trophy,
  },
  Legendary: {
    label: 'Legendary',
    gradient: 'from-amber-400 to-orange-500',
    border: 'border-amber-300 dark:border-amber-500',
    glow: 'shadow-amber-200 dark:shadow-amber-900',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    icon: Zap,
  },
};

// ---------------------------------------------------------------------------
// BadgeCard
// ---------------------------------------------------------------------------
export function BadgeCard({ badge, onClick }) {
  const { t, i18n } = useTranslation(['badges']);
  const rarity = RARITY_CONFIG[badge.rarity] ?? RARITY_CONFIG.Common;
  const RarityIcon = rarity.icon;
  const isEarned = badge.isEarned;
  const display = getBadgeDisplay(badge, t);
  const earnedDate = badge.earnedAt
    ? new Date(badge.earnedAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')
    : null;
  const statusLabel = isEarned ? t('earned') : t('notEarned');

  return (
    <motion.button
      onClick={() => onClick(badge)}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={[
        'relative w-full cursor-pointer rounded-2xl border p-4 text-start transition-shadow duration-200',
        'bg-white dark:bg-slate-900',
        rarity.border,
        isEarned ? `shadow-md ${rarity.glow}` : 'shadow-sm opacity-70',
      ].join(' ')}
      aria-label={t('ariaLabel', { name: display.name, status: statusLabel })}
    >
      {!isEarned && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50">
          <Lock size={14} className="absolute end-3 top-3 text-slate-400 dark:text-slate-500" />
        </div>
      )}

      <div
        className={[
          'mb-3 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br',
          isEarned ? rarity.gradient : 'from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600',
        ].join(' ')}
      >
        <RarityIcon size={22} className="text-white" />
      </div>

      <p className={`mb-1 text-sm font-semibold leading-tight ${isEarned ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
        {display.name}
      </p>

      <p className="mb-2 truncate text-xs text-slate-400 dark:text-slate-500">
        {display.category}
      </p>

      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${rarity.badge}`}>
        {translateBadgeRarity(badge.rarity, t)}
      </span>

      {isEarned && earnedDate && (
        <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
          {t('earnedOn', { date: earnedDate })}
        </p>
      )}
    </motion.button>
  );
}
