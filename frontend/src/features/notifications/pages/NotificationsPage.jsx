import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Filter, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotificationStore } from '@/store/useNotificationStore';

import { NotificationList } from '../components/NotificationList';
import { NotificationService } from '../services/notification.service';

const TYPE_OPTIONS = ['ALL', 'ACHIEVEMENT', 'BADGE', 'REMINDER', 'MENTOR', 'MISSION_ASSIGNED', 'MISSION_COMPLETED', 'ADMINISTRATIVE'];
const READ_OPTIONS = ['all', 'unread', 'read'];

function NotificationStatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <Skeleton key={item} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

export function NotificationsPage() {
  const { t } = useTranslation(['notifications']);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { fetchUnread, markAsRead, markAllAsRead } = useNotificationStore();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('ALL');
  const [readStatus, setReadStatus] = useState('all');

  const filters = useMemo(() => ({
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(type !== 'ALL' ? { type } : {}),
    ...(readStatus === 'read' ? { isRead: true } : {}),
    ...(readStatus === 'unread' ? { isRead: false } : {}),
  }), [readStatus, search, type]);

  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'center', filters],
    queryFn: () => NotificationService.getNotifications(0, 50, filters),
    staleTime: 20_000,
  });

  const statsQuery = useQuery({
    queryKey: ['notifications', 'stats'],
    queryFn: NotificationService.getStats,
    staleTime: 20_000,
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      fetchUnread();
    },
  });

  const handleMarkRead = async (id) => {
    await markAsRead(id);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    fetchUnread();
  };

  const handleOpenNotification = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      fetchUnread();
    }

    const route = notification.metadata?.route;
    if (route) {
      navigate(route);
    }
  };

  const stats = statsQuery.data;
  const notifications = notificationsQuery.data?.notifications ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary rtl:normal-case rtl:tracking-normal">
            {t('center.eyebrow')}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t('center.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t('center.description')}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => markAllMutation.mutate()}
          disabled={!stats?.unread || markAllMutation.isPending}
        >
          <CheckCheck className="h-4 w-4" />
          {t('markAllAsRead')}
        </Button>
      </div>

      {statsQuery.isLoading ? (
        <NotificationStatsSkeleton />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{t('center.stats.total')}</p>
              <p className="mt-2 text-2xl font-bold">{stats?.total ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{t('center.stats.unread')}</p>
              <p className="mt-2 text-2xl font-bold text-primary">{stats?.unread ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{t('center.stats.read')}</p>
              <p className="mt-2 text-2xl font-bold">{stats?.read ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            {t('center.filters.title')}
          </CardTitle>
          <CardDescription>{t('center.filters.description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-11 w-full rounded-lg border border-border bg-background ps-10 pe-3 text-sm outline-none transition focus:border-primary"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('center.filters.search')}
            />
          </label>

          <select
            className="h-11 rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`center.types.${option}`)}
              </option>
            ))}
          </select>

          <select
            className="h-11 rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
            value={readStatus}
            onChange={(event) => setReadStatus(event.target.value)}
          >
            {READ_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`center.readStatus.${option}`)}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{t('center.list.title')}</CardTitle>
              <CardDescription>{t('center.list.description')}</CardDescription>
            </div>
            {stats?.unread > 0 && (
              <Badge variant="default">{t('unread', { count: stats.unread })}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {notificationsQuery.isLoading && (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-20 rounded-xl" />
              ))}
            </div>
          )}

          {notificationsQuery.isError && (
            <EmptyState
              icon={Bell}
              title={t('loadFailed')}
              description={t('center.states.errorDescription')}
              action={(
                <Button type="button" variant="outline" onClick={() => notificationsQuery.refetch()}>
                  {t('center.actions.retry')}
                </Button>
              )}
            />
          )}

          {!notificationsQuery.isLoading && !notificationsQuery.isError && notifications.length === 0 && (
            <EmptyState
              icon={Bell}
              title={t('empty')}
              description={t('center.states.emptyDescription')}
            />
          )}

          {!notificationsQuery.isLoading && !notificationsQuery.isError && notifications.length > 0 && (
            <NotificationList
              notifications={notifications}
              onMarkRead={handleMarkRead}
              onOpenNotification={handleOpenNotification}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
