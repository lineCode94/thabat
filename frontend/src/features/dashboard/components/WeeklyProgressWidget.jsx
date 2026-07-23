import { useQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrackingService } from '@/features/tracking/services/tracking.service';

function getDayScore(day) {
  const totalScore = day.entries.reduce((total, entry) => total + Number(entry.worshipItem?.score ?? 0), 0);
  const earnedScore = day.entries.reduce((total, entry) => total + Number(entry.scoreEarned ?? 0), 0);

  return { totalScore, earnedScore };
}

export function WeeklyProgressWidget() {
  const { t } = useTranslation(['dashboard']);
  const historyQuery = useQuery({
    queryKey: ['trackingHistory', 'dashboard-week'],
    queryFn: () => TrackingService.getHistory(),
    staleTime: 30_000,
  });

  const stats = useMemo(() => {
    const days = historyQuery.data?.days ?? [];
    const scoredDays = days.map((day) => ({ ...day, score: getDayScore(day) }));
    const trackedDays = scoredDays.filter((day) => day.score.totalScore > 0);
    const completedDays = trackedDays.filter((day) => day.score.earnedScore > 0);
    const weekEarned = scoredDays.reduce((total, day) => total + day.score.earnedScore, 0);
    const weekTotal = scoredDays.reduce((total, day) => total + day.score.totalScore, 0);
    const percentage = weekTotal > 0 ? Math.round((weekEarned / weekTotal) * 100) : 0;

    return {
      days: scoredDays,
      completedDays: completedDays.length,
      weekEarned,
      weekTotal,
      percentage,
      range: historyQuery.data?.week
        ? `${historyQuery.data.week.weekStartDate} - ${historyQuery.data.week.weekEndDate}`
        : '',
    };
  }, [historyQuery.data]);

  if (historyQuery.isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3 p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (historyQuery.isError) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5 text-primary" />
          {t('weekProgress.title')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{stats.range}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
            <p className="text-2xl font-bold">{stats.completedDays}</p>
            <p className="text-xs text-muted-foreground">{t('weekProgress.activeDays')}</p>
          </div>
          <div className="rounded-xl bg-violet-100 p-3 dark:bg-violet-950/50">
            <p className="text-2xl font-bold">{stats.weekEarned}</p>
            <p className="text-xs text-muted-foreground">{t('weekProgress.points')}</p>
          </div>
          <div className="rounded-xl bg-emerald-100 p-3 dark:bg-emerald-950/40">
            <p className="text-2xl font-bold">{stats.percentage}%</p>
            <p className="text-xs text-muted-foreground">{t('weekProgress.consistency')}</p>
          </div>
        </div>

        <div className="flex gap-1.5">
          {stats.days.map((day) => {
            const percentage = day.score.totalScore > 0
              ? Math.round((day.score.earnedScore / day.score.totalScore) * 100)
              : 0;

            return (
              <div
                key={day.date}
                className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
                title={`${day.date}: ${percentage}%`}
              >
                <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
