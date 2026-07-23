import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Medal, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Skeleton } from '@/components/ui/skeleton';

import { BadgeService } from '../services/badge.service';

const RARITY_DOT = {
  Common: 'bg-slate-400',
  Rare: 'bg-blue-500',
  Epic: 'bg-purple-500',
  Legendary: 'bg-amber-400',
};

export function RecentBadgesWidget() {
  const navigate = useNavigate();
  const { t } = useTranslation(['badges']);

  const { data: recent, isLoading } = useQuery({
    queryKey: ['badges', 'recent'],
    queryFn: () => BadgeService.getRecent(3),
  });

  if (isLoading) {
    return (
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!recent || recent.length === 0) {
    return (
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-slate-700 dark:bg-slate-900">
        <ShieldCheck size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-400 dark:text-slate-500">{t('noneEarned')}</p>
        <button
          onClick={() => navigate('/badges')}
          className="text-xs font-medium text-green-600 hover:underline dark:text-green-400"
        >
          {t('viewAllBadges')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Medal size={15} className="text-amber-500" />
          {t('recentlyEarned')}
        </h3>
        <button
          onClick={() => navigate('/badges')}
          className="text-xs text-green-600 hover:underline dark:text-green-400"
        >
          {t('viewAll')}
        </button>
      </div>

      <div className="space-y-2">
        {recent.map((badge, i) => (
          <motion.button
            key={badge.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => navigate('/badges')}
            className="flex w-full items-center gap-3 rounded-xl p-2.5 text-start transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${RARITY_DOT[badge.rarity] ?? 'bg-slate-400'}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                {badge.name}
              </p>
              <p className="truncate text-xs text-slate-400">{badge.category}</p>
            </div>
            {badge.earnedAt && (
              <p className="shrink-0 text-[10px] text-slate-400">
                {new Date(badge.earnedAt).toLocaleDateString()}
              </p>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
