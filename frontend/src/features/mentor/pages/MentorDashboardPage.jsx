import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ClipboardCheck,
  MessageSquareText,
  PencilRuler,
  TrendingDown,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MentorDashboardService } from '@/features/mentor/services/mentor-dashboard.service';

const STAT_ICONS = {
  assignedUsers: Users,
  activeToday: ClipboardCheck,
  missingToday: AlertTriangle,
  weakUsers: TrendingDown,
  averageConsistency: PencilRuler,
  pendingReviews: MessageSquareText,
};

function StatCard({ label, value, icon: Icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export function MentorDashboardPage() {
  const { t } = useTranslation(['mentor']);
  const dashboardQuery = useQuery({
    queryKey: ['mentor', 'dashboard'],
    queryFn: MentorDashboardService.getDashboard,
  });
  const dashboard = dashboardQuery.data;
  const users = dashboard?.users ?? [];

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary rtl:normal-case rtl:tracking-normal">
          {t('dashboard.eyebrow')}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          {t('dashboard.title')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t('dashboard.description')}
        </p>
      </section>

      {dashboardQuery.isLoading && (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => <Skeleton key={item} className="h-28" />)}
        </div>
      )}

      {dashboardQuery.isError && (
        <EmptyState
          icon={AlertTriangle}
          title={t('dashboard.errorTitle')}
          description={t('dashboard.errorDescription')}
          action={<Button variant="outline" onClick={() => dashboardQuery.refetch()}>{t('dashboard.retry')}</Button>}
        />
      )}

      {dashboard && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(dashboard.totals).map(([key, value]) => {
              const Icon = STAT_ICONS[key] ?? Users;
              const renderedValue = key === 'averageConsistency' ? `${value}%` : value;

              return (
                <StatCard
                  key={key}
                  label={t(`dashboard.stats.${key}`)}
                  value={renderedValue}
                  icon={Icon}
                />
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.users.title')}</CardTitle>
              <CardDescription>{t('dashboard.users.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title={t('dashboard.users.emptyTitle')}
                  description={t('dashboard.users.emptyDescription')}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('dashboard.users.name')}</TableHead>
                      <TableHead>{t('dashboard.users.level')}</TableHead>
                      <TableHead>{t('dashboard.users.today')}</TableHead>
                      <TableHead>{t('dashboard.users.week')}</TableHead>
                      <TableHead>{t('dashboard.users.comments')}</TableHead>
                      <TableHead className="text-end">{t('dashboard.users.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">{user.fullName}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </TableCell>
                        <TableCell>{user.worshipLevel?.name ?? '-'}</TableCell>
                        <TableCell>
                          <Badge variant={user.today.tracked ? 'success' : 'secondary'}>
                            {user.today.tracked
                              ? t('dashboard.users.tracked', { value: user.today.consistencyPercentage })
                              : t('dashboard.users.notTracked')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">{user.week.consistencyPercentage}%</div>
                          {user.weakThisWeek && (
                            <div className="mt-1 text-xs text-amber-500">{t('dashboard.users.weak')}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.recentComments.length > 0 ? (
                            <div className="max-w-xs space-y-1">
                              {user.recentComments.slice(0, 2).map((comment) => (
                                <p key={`${user.id}-${comment.date}-${comment.itemTitle}`} className="line-clamp-1 text-xs text-muted-foreground">
                                  {comment.itemTitle}: {comment.note}
                                </p>
                              ))}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-end">
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link to={`/reports/weekly?userId=${user.id}`}>
                                {t('dashboard.users.report')}
                              </Link>
                            </Button>
                            <Button asChild size="sm">
                              <Link to="/admin/worship-levels">
                                {t('dashboard.users.assignLevel')}
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
