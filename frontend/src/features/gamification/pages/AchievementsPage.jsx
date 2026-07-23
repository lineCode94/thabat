import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';

import { AchievementDetailDialog } from '../components/AchievementDetailDialog';
import { AchievementGrid } from '../components/AchievementGrid';
import { AchievementService } from '../services/achievement.service';
import { getAchievementDisplay } from '../utils/achievementTranslations';

export function AchievementsPage() {
  const [selected, setSelected] = useState(null);
  const { t, i18n } = useTranslation(['achievements', 'common']);

  const { data: achievements, isLoading, isError, refetch } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => AchievementService.getAll(),
  });

  const unlockedCount = achievements?.filter((a) => a.state === 'UNLOCKED').length ?? 0;
  const recentlyUnlocked = achievements
    ?.filter((a) => a.state === 'UNLOCKED')
    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
    .slice(0, 3) ?? [];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
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

  if (!achievements || achievements.length === 0) {
    return (
      <div className="mt-20 space-y-3 text-center text-slate-500">
        <Trophy size={48} className="mx-auto text-slate-300" />
        <p className="text-lg font-semibold">{t('emptyTitle')}</p>
        <p className="text-sm">{t('emptyDescription')}</p>
      </div>
    );
  }

  const completionPercent = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Trophy className="text-yellow-500" size={30} /> {t('title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('unlockedCount', { unlocked: unlockedCount, total: achievements.length })}
          </p>
        </div>

        <div className="w-full space-y-1 md:w-48">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <motion.div
              className="h-full rounded-full bg-yellow-400"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercent}%` }}
              transition={{ duration: 1.0, ease: 'easeOut' }}
            />
          </div>
          <p className="text-end text-xs text-slate-400">
            {t('complete', { percent: completionPercent })}
          </p>
        </div>
      </div>

      {recentlyUnlocked.length > 0 && (
        <div>
          <h2 className="mb-3 text-base font-semibold text-slate-600 dark:text-slate-300">
            {t('recentlyUnlocked')}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentlyUnlocked.map((achievement) => (
              <button
                key={achievement.key}
                onClick={() => setSelected(achievement)}
                className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-start transition-colors hover:bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30"
              >
                <Trophy size={18} className="shrink-0 text-yellow-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {getAchievementDisplay(achievement, t).name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(achievement.unlockedAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <AchievementGrid achievements={achievements} onSelect={setSelected} />
      <AchievementDetailDialog achievement={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
