import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { GamificationService } from '../services/gamification.service';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function DayDot({ active, index }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-1"
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300 }}
    >
      <div
        className={`h-8 w-8 rounded-full border-2 transition-colors ${
          active
            ? 'border-green-500 bg-green-500 shadow-md shadow-green-300 dark:shadow-green-900'
            : 'border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'
        }`}
      />
      <span className="text-xs font-medium text-slate-400">{DAY_LABELS[index]}</span>
    </motion.div>
  );
}

export function WeeklyConsistency() {
  const { t } = useTranslation(['dashboard']);
  const { data: streak, isLoading } = useQuery({
    queryKey: ['streakInfo'],
    queryFn: () => GamificationService.getStreak(),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">{t('thisWeek')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!streak) return null;

  const { completedDays, totalDays, percentage } = streak.weeklyConsistency;
  const dots = Array.from({ length: totalDays }, (_, i) => i < completedDays);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-slate-500">
          <span>{t('thisWeek')}</span>
          <span className="text-base font-bold text-slate-700 dark:text-slate-200">{percentage}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between gap-1.5">
          {dots.map((active, i) => (
            <DayDot key={i} active={active} index={i} />
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-slate-400">
          {t('daysCompleted', { completed: completedDays, total: totalDays })}
        </p>
      </CardContent>
    </Card>
  );
}
