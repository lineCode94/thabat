import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { GamificationService } from '../services/gamification.service';

export function MonthlyConsistency() {
  const { t } = useTranslation(['dashboard']);
  const { data: streak, isLoading } = useQuery({
    queryKey: ['streakInfo'],
    queryFn: () => GamificationService.getStreak(),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">{t('thisMonth')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (!streak) return null;

  const { completedDays, totalDays, percentage } = streak.monthlyConsistency;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-slate-500">
          <span>{t('thisMonth')}</span>
          <span className="text-base font-bold text-slate-700 dark:text-slate-200">{percentage}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.0, ease: 'easeOut' }}
          />
        </div>

        <p className="text-center text-xs text-slate-400">
          {t('daysCompletedThisMonth', { completed: completedDays, total: totalDays })}
        </p>
      </CardContent>
    </Card>
  );
}
