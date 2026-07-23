import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Medal, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';

import { BadgeDetailDialog } from '../components/BadgeDetailDialog';
import { BadgeGrid } from '../components/BadgeGrid';
import { BadgeService } from '../services/badge.service';
import { getBadgeDisplay } from '../utils/badgeTranslations';

export function BadgesPage() {
  const [selected, setSelected] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const { t, i18n } = useTranslation(['badges', 'common']);

  const { data: badges, isLoading, isError, refetch } = useQuery({
    queryKey: ['badges'],
    queryFn: () => BadgeService.getAll(),
  });

  const earnedCount = badges?.filter((badge) => badge.isEarned).length ?? 0;
  const totalCount = badges?.length ?? 0;
  const percentComplete = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-3 w-full rounded-full" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-16 space-y-3 text-center">
        <p className="font-semibold text-red-500">{t('failed')}</p>
        <button onClick={refetch} className="text-sm text-blue-500 hover:underline">
          {t('common:actions.retry')}
        </button>
      </div>
    );
  }

  if (!badges || badges.length === 0) {
    return (
      <div className="mt-20 space-y-3 text-center text-slate-500">
        <ShieldCheck size={48} className="mx-auto text-slate-300" />
        <p className="text-lg font-semibold">{t('emptyTitle')}</p>
        <p className="text-sm">{t('emptyDescription')}</p>
      </div>
    );
  }

  const recentlyEarned = badges
    .filter((badge) => badge.isEarned)
    .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-800 dark:text-slate-100">
            <Medal className="text-amber-500" size={30} />
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('earnedCount', { earned: earnedCount, total: totalCount })}
          </p>
        </div>

        <div className="w-full space-y-1 md:w-52">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
              initial={{ width: 0 }}
              animate={{ width: `${percentComplete}%` }}
              transition={{ duration: 1.0, ease: 'easeOut' }}
            />
          </div>
          <p className="text-end text-xs text-slate-400 dark:text-slate-500">
            {t('complete', { percent: percentComplete })}
          </p>
        </div>
      </div>

      {recentlyEarned.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t('recentlyEarned')}
          </h2>
          <div className="flex flex-wrap gap-3">
            {recentlyEarned.map((badge) => (
              <button
                key={badge.key}
                onClick={() => setSelected(badge)}
                className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-start transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:hover:bg-amber-900/30"
              >
                <Medal size={14} className="shrink-0 text-amber-500" />
                <div>
                  <p className="text-sm font-semibold leading-none text-slate-800 dark:text-slate-100">
                    {getBadgeDisplay(badge, t).name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {new Date(badge.earnedAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <BadgeGrid
        badges={badges}
        onSelect={setSelected}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <BadgeDetailDialog badge={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
