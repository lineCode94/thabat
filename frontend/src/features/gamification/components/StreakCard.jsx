import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { GamificationService } from '../services/gamification.service';

const STATUS_CONFIG = {
  ACTIVE: { bg: 'from-orange-500 to-rose-600', text: 'text-orange-100' },
  AT_RISK: { bg: 'from-yellow-500 to-amber-600', text: 'text-yellow-100' },
  BROKEN: { bg: 'from-slate-500 to-slate-700', text: 'text-slate-200' },
  NEW: { bg: 'from-orange-500 to-violet-600', text: 'text-orange-100' },
};

export function StreakCard() {
  const { t } = useTranslation(['common', 'dashboard']);
  const { data: streak, isLoading } = useQuery({
    queryKey: ['streakInfo'],
    queryFn: () => GamificationService.getStreak(),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">
            {t('dashboard:streak.label')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>
    );
  }

  if (!streak) return null;

  const config = STATUS_CONFIG[streak.streakStatus] ?? STATUS_CONFIG.NEW;

  return (
    <Card className={`relative overflow-hidden border-none bg-gradient-to-br ${config.bg} text-white shadow-lg`}>
      <div className="absolute -bottom-4 -end-4 opacity-10">
        <Flame size={100} />
      </div>

      <CardHeader className="relative z-10 pb-0">
        <CardTitle className={`flex items-center gap-2 text-sm font-medium uppercase tracking-wider ${config.text}`}>
          <Flame size={16} className="text-white" />
          {t('dashboard:streak.title')}
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 pb-6 pt-4">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <AnimatePresence mode="wait">
              <motion.span
                key={streak.currentStreak}
                className="text-5xl font-bold"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {streak.currentStreak}
              </motion.span>
            </AnimatePresence>
            <span className={`ms-2 text-sm font-medium ${config.text}`}>{t('common:units.days')}</span>
          </div>

          <div className={`flex items-center gap-1 text-end text-sm font-medium ${config.text}`}>
            <Trophy size={14} />
            {t('dashboard:streak.best', { days: streak.longestStreak })}
          </div>
        </div>

        <div className={`text-xs font-semibold uppercase tracking-wide ${config.text}`}>
          {t(`dashboard:streak.statuses.${streak.streakStatus}`, {
            defaultValue: t('dashboard:streak.statuses.NEW'),
          })}
          {streak.lastCompletedDate && (
            <span className="ms-2 opacity-75">
              {t('dashboard:streak.lastTracked', { date: streak.lastCompletedDate })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
