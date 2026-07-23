import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarDays, Flame, StickyNote, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportBreakdownTable } from '@/features/reports/components/ReportBreakdownTable';
import { ReportMetricCards } from '@/features/reports/components/ReportMetricCards';
import { RewardList } from '@/features/reports/components/RewardList';
import { ReportService } from '@/features/reports/services/report.service';

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function DailyStatusCard({ report }) {
  const { t } = useTranslation(['reports']);
  const status = report?.trackingDay?.status ?? 'OPEN';
  const score = report?.totals?.completedScore ?? 0;
  const total = report?.totals?.possibleScore ?? 0;
  const percent = report?.totals?.consistencyPercentage ?? 0;

  return (
    <Card className="overflow-hidden border-primary/20 bg-primary/5">
      <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{t(`daily.status.${status}`, { defaultValue: status })}</Badge>
            <Badge variant="secondary">{percent}%</Badge>
          </div>
          <h2 className="mt-3 text-2xl font-bold text-card-foreground">
            {t('daily.scoreLine', { score, total })}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('daily.statusDescription')}
          </p>
        </div>
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-2xl font-black text-primary-foreground shadow-[0_18px_35px_rgba(139,92,246,0.25)]">
          {percent}%
        </div>
      </CardContent>
    </Card>
  );
}

function DailyInsightCards({ report }) {
  const { t } = useTranslation(['reports']);
  const rewardsCount = (report?.rewards?.badges?.length ?? 0)
    + (report?.rewards?.achievements?.length ?? 0)
    + (report?.rewards?.missions?.length ?? 0);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm text-muted-foreground">{t('daily.insights.streak')}</CardTitle>
          <Flame className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{report?.streak?.currentStreak ?? 0}</p>
          <p className="text-xs text-muted-foreground">{t('daily.insights.streakHint')}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm text-muted-foreground">{t('daily.insights.rewards')}</CardTitle>
          <Trophy className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{rewardsCount}</p>
          <p className="text-xs text-muted-foreground">{t('daily.insights.rewardsHint')}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm text-muted-foreground">{t('daily.insights.notes')}</CardTitle>
          <StickyNote className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-sm font-medium">
            {report?.trackingDay?.notes || t('daily.insights.noNotes')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function DailyReportPage() {
  const { i18n, t } = useTranslation(['reports']);
  const [date, setDate] = useState(toDateKey(new Date()));

  const reportQuery = useQuery({
    queryKey: ['reports', 'daily', date],
    queryFn: () => ReportService.getDaily({ date }),
  });

  const report = reportQuery.data;
  const formattedDate = useMemo(() => {
    const parsed = new Date(`${date}T00:00:00`);
    return new Intl.DateTimeFormat(i18n.language, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(parsed);
  }, [date, i18n.language]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary rtl:normal-case rtl:tracking-normal">
            {t('daily.eyebrow')}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t('daily.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t('daily.description')}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border bg-card p-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-10 w-44 border-0 bg-transparent"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{formattedDate}</CardTitle>
        </CardHeader>
        <CardContent>
          {reportQuery.isLoading && (
            <div className="grid gap-4 md:grid-cols-4">
              {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-28" />)}
            </div>
          )}

          {reportQuery.isError && (
            <EmptyState
              icon={AlertTriangle}
              title={t('daily.states.errorTitle')}
              description={t('daily.states.errorDescription')}
              action={<Button variant="outline" onClick={() => reportQuery.refetch()}>{t('weekly.actions.retry')}</Button>}
            />
          )}

          {!reportQuery.isLoading && !reportQuery.isError && (
            report?.trackingDay ? (
              <ReportMetricCards totals={report.totals} />
            ) : (
              <EmptyState
                icon={CalendarDays}
                title={t('daily.states.emptyTitle')}
                description={t('daily.states.emptyDescription')}
              />
            )
          )}
        </CardContent>
      </Card>

      {report && (
        <>
          {report.trackingDay && (
            <>
              <DailyStatusCard report={report} />
              <DailyInsightCards report={report} />
            </>
          )}
          <ReportBreakdownTable items={report.worshipBreakdown} />
          <RewardList rewards={report.rewards} />
        </>
      )}
    </div>
  );
}
