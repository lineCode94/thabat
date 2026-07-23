import { AnimatePresence, motion } from 'framer-motion';
import { Medal, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import { getBadgeDisplay, translateBadgeRarity } from '../utils/badgeTranslations';

export function EarnedBadgesDialog({ badges = [], onClose }) {
  const { t } = useTranslation(['badges']);

  if (!badges.length) return null;

  const title = badges.length === 1 ? t('newBadgeTitle') : t('newBadgesTitle');
  const description = badges.length === 1
    ? t('newBadgeDescription')
    : t('newBadgesDescription', { count: badges.length });

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 18 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <div className="pointer-events-auto w-full max-w-lg overflow-hidden rounded-3xl border border-amber-300/50 bg-white shadow-2xl dark:border-amber-700/40 dark:bg-slate-950">
          <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-violet-500" />
          <div className="space-y-6 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                  <Medal className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-slate-950 dark:text-white">
                    {title}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                aria-label={t('closeDialog')}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3">
              {badges.map((badge) => {
                const display = getBadgeDisplay(badge, t);

                return (
                  <div
                    key={badge.key}
                    className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                      <Medal className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
                        {display.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {display.category} • {translateBadgeRarity(badge.rarity, t)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button type="button" className="w-full" onClick={onClose}>
              {t('continue')}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
