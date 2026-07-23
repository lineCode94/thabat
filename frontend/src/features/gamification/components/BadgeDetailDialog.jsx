import { AnimatePresence, motion } from 'framer-motion';
import { Lock, Medal, Star, Trophy, X, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getBadgeDisplay, translateBadgeRarity } from '../utils/badgeTranslations';

const RARITY_CONFIG = {
  Common: {
    gradient: 'from-slate-400 to-slate-500',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    icon: Medal,
    glow: '',
  },
  Rare: {
    gradient: 'from-blue-500 to-indigo-600',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    icon: Star,
    glow: 'ring-2 ring-blue-400/40',
  },
  Epic: {
    gradient: 'from-purple-500 to-fuchsia-600',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    icon: Trophy,
    glow: 'ring-2 ring-purple-400/40',
  },
  Legendary: {
    gradient: 'from-amber-400 to-orange-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    icon: Zap,
    glow: 'ring-2 ring-amber-400/40',
  },
};

export function BadgeDetailDialog({ badge, onClose }) {
  const { t, i18n } = useTranslation(['badges']);

  if (!badge) return null;

  const rarity = RARITY_CONFIG[badge.rarity] ?? RARITY_CONFIG.Common;
  const RarityIcon = rarity.icon;
  const isEarned = badge.isEarned;
  const display = getBadgeDisplay(badge, t);
  const earnedDate = badge.earnedAt
    ? new Date(badge.earnedAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : null;

  return (
    <AnimatePresence>
      {badge && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
              <div className={`h-2 w-full bg-gradient-to-r ${rarity.gradient}`} />

              <div className="space-y-5 p-6">
                <div className="flex justify-end">
                  <button
                    onClick={onClose}
                    className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    aria-label={t('closeDialog')}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex flex-col items-center gap-3 text-center">
                  <div
                    className={[
                      'flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br',
                      isEarned ? rarity.gradient : 'from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600',
                      rarity.glow,
                    ].join(' ')}
                  >
                    {isEarned ? (
                      <RarityIcon size={36} className="text-white" />
                    ) : (
                      <Lock size={28} className="text-white/70" />
                    )}
                  </div>

                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${rarity.badge}`}>
                    {translateBadgeRarity(badge.rarity, t)}
                  </span>

                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      {display.name}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                      {display.category}
                    </p>
                  </div>
                </div>

                <p className="text-center text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {display.description}
                </p>

                {isEarned ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-green-100 bg-green-50 p-3 dark:border-green-900 dark:bg-green-900/20">
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {t('earned')}
                    </span>
                    {earnedDate && (
                      <span className="text-sm text-green-500 dark:text-green-500">
                        {earnedDate}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                    <Lock size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-400 dark:text-slate-500">
                      {t('notEarned')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
