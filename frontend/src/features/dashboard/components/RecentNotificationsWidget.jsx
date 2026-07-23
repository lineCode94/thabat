import { useQuery } from '@tanstack/react-query';
import { Bell, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationService } from '@/features/notifications/services/notification.service';

export function RecentNotificationsWidget() {
  const { t } = useTranslation(['dashboard']);
  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'dashboard-recent'],
    queryFn: () => NotificationService.getNotifications(0, 4).then((data) => data.notifications ?? []),
    staleTime: 30_000,
  });

  if (notificationsQuery.isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3 p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (notificationsQuery.isError) return null;

  const notifications = notificationsQuery.data ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-primary" />
            {t('recentNotifications.title')}
          </CardTitle>
          <Link to="/notifications" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            {t('recentNotifications.viewAll')}
            <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
            {t('recentNotifications.empty')}
          </p>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                to={notification.metadata?.route ?? '/notifications'}
                className="block rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-primary/40 hover:bg-primary/5 dark:border-slate-800 dark:bg-slate-900/70"
              >
                <div className="flex items-start gap-2">
                  {!notification.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{notification.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{notification.message}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
