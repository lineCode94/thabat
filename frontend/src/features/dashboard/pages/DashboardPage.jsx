import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { LevelCard } from '@/features/gamification/components/LevelCard';
import { RecentBadgesWidget } from '@/features/gamification/components/RecentBadgesWidget';
import { StreakCard } from '@/features/gamification/components/StreakCard';
import { TrackingService } from '@/features/tracking/services/tracking.service';

import { DashboardAdviceCard } from '../components/DashboardAdviceCard';
import { DashboardOverview } from '../components/DashboardOverview';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { MissionSummaryWidget } from '../components/MissionSummaryWidget';
import { RecentNotificationsWidget } from '../components/RecentNotificationsWidget';
import { TodayOverview } from '../components/TodayOverview';
import { UpcomingReminders } from '../components/UpcomingReminders';
import { WeeklyProgressWidget } from '../components/WeeklyProgressWidget';
import { WorshipList } from '../components/WorshipList';

function getTodayXp(trackingDay) {
  return (trackingDay?.trackingEntries ?? []).reduce((total, entry) => total + Number(entry.scoreEarned ?? 0), 0);
}

export function DashboardPage() {
  const { t } = useTranslation(['common', 'dashboard']);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['trackingToday'],
    queryFn: () => TrackingService.getToday(),
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <div className="text-red-500 font-bold text-lg">{t('dashboard:errorTitle')}</div>
        <p className="text-slate-500">{t('dashboard:errorDescription')}</p>
        <Button onClick={() => refetch()} variant="outline">{t('common:actions.retry')}</Button>
      </div>
    );
  }

  const { trackingDay, summary } = data || {};
  const enrichedSummary = summary ? { ...summary, todayXp: getTodayXp(trackingDay) } : summary;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="app-neo-hero relative overflow-hidden rounded-[28px] border-2 border-slate-950 p-6 shadow-[8px_8px_0_hsl(var(--primary))] dark:border-white">
        <div className="relative z-10 flex flex-col gap-1">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary rtl:normal-case rtl:tracking-normal">
            THABAT
          </p>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 dark:text-white">
            {t('dashboard:title')}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t('dashboard:subtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LevelCard />
        <StreakCard />
      </div>

      <TodayOverview summary={enrichedSummary} />
      <DashboardAdviceCard summary={enrichedSummary} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardOverview summary={enrichedSummary} />
        <WeeklyProgressWidget />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <WorshipList trackingDay={trackingDay} readiness={data} />
        </div>
        <div className="md:col-span-1 space-y-4">
          <MissionSummaryWidget />
          <RecentBadgesWidget />
          <RecentNotificationsWidget />
          <UpcomingReminders />
        </div>
      </div>
    </div>
  );
}
