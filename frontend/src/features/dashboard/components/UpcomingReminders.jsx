import { useQuery } from '@tanstack/react-query';
import { BellRing } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';
import { NotificationPreferenceService } from '@/features/notifications/services/notification-preference.service';

export function UpcomingReminders() {
  const { t } = useTranslation(['dashboard']);
  const preferencesQuery = useQuery({
    queryKey: ['notification-preferences', 'dashboard-reminders'],
    queryFn: NotificationPreferenceService.getPreferences,
    staleTime: 60_000,
  });

  if (preferencesQuery.isLoading) {
    return (
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (preferencesQuery.isError) return null;

  const preferences = preferencesQuery.data;
  const quietHours = preferences?.quietHoursStart && preferences?.quietHoursEnd
    ? `${preferences.quietHoursStart} - ${preferences.quietHoursEnd}`
    : t('reminders.none');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
        <BellRing className="h-5 w-5 text-primary" />
        {t('upcomingReminders')}
      </h3>
      <div className="space-y-2">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <p className="text-xs text-muted-foreground">{t('reminders.daily')}</p>
          <p className="mt-1 font-semibold">{preferences?.dailyReminders ? preferences.reminderTime : t('reminders.disabled')}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <p className="text-xs text-muted-foreground">{t('reminders.weekly')}</p>
          <p className="mt-1 font-semibold">{preferences?.weeklyReminders ? t('reminders.enabled') : t('reminders.disabled')}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <p className="text-xs text-muted-foreground">{t('reminders.quietHours')}</p>
          <p className="mt-1 font-semibold">{quietHours}</p>
        </div>
      </div>
    </div>
  );
}
