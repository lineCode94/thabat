import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarRange, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { cn } from '@/lib/utils';

function toMonthKey(date) {
  return date.toISOString().slice(0, 7);
}

function DayHighlight({ title, day, icon: Icon }) {
  const { t } = useTranslation(['reports']);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{day?.date ?? '-'}</CardDescription>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{day?.consistencyPercentage ?? 0}%</p>
        <p className="text-sm text-muted-foreground">
          {t('monthly.dayScore', { score: day?.score ?? 0, total: day?.possibleScore ?? 0 })}
        </p>
      </CardContent>
    </Card>
  );
}

function formatDayNumber(dateKey, language) {
  if (!dateKey) return '-';
  return new Intl.DateTimeFormat(language, { day: 'numeric' }).format(new Date(`${dateKey}T00:00:00`));
}

function getDayTone(percent) {
  if (percent >= 90) return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200';
  if (percent >= 50) return 'border-primary/40 bg-primary/15 text-primary-foreground';
  if (percent > 0) return 'border-amber-500/40 bg-amber-500/15 text-amber-200';
  return 'border-border bg-muted/20 text-muted-foreground';
}

function MonthlyCalendar({ days = [] }) {
  const { i18n, t } = useTranslation(['reports']);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('monthly.calendar.title')}</CardTitle>
        <CardDescription>{t('monthly.calendar.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {days.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title={t('monthly.calendar.emptyTitle')}
            description={t('monthly.calendar.emptyDescription')}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {days.map((day) => (
              <div
                key={day.date}
                className={cn(
                  'min-h-28 rounded-xl border p-3 transition-transform hover:-translate-y-0.5',
                  getDayTone(day.consistencyPercentage ?? 0),
                )}
                title={t('monthly.calendar.dayTitle', {
                  date: day.date,
                  percent: day.consistencyPercentage ?? 0,
                })}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-lg font-bold">{formatDayNumber(day.date, i18n.language)}</span>
                  <span className="rounded-full bg-background/50 px-2 py-0.5 text-xs font-bold">
                    {day.consistencyPercentage ?? 0}%
                  </span>
                </div>
                <p className="mt-4 text-sm font-semibold">
                  {day.score ?? 0} / {day.possibleScore ?? 0}
                </p>
                <p className="mt-1 text-xs opacity-80">
                  {t('monthly.calendar.items', {
                    completed: day.completedItems ?? 0,
                    total: day.totalItems ?? 0,
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MonthlyReportPage() {
  const { i18n, t } = useTranslation(['reports']);
  const [month, setMonth] = useState(toMonthKey(new Date()));

  const reportQuery = useQuery({
    queryKey: ['reports', 'monthly', month],
    queryFn: () => ReportService.getMonthly({ month }),
  });

  const report = reportQuery.data;
  const formattedMonth = useMemo(() => {
    const parsed = new Date(`${month}-01T00:00:00`);
    return new Intl.DateTimeFormat(i18n.language, {
      month: 'long',
      year: 'numeric',
    }).format(parsed);
  }, [month, i18n.language]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary rtl:normal-case rtl:tracking-normal">
            {t('monthly.eyebrow')}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t('monthly.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t('monthly.description')}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border bg-card p-2">
          <CalendarRange className="h-4 w-4 text-primary" />
          <Input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="h-10 w-44 border-0 bg-transparent"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{formattedMonth}</CardTitle>
          <CardDescription>{t('monthly.monthSummary')}</CardDescription>
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
              title={t('monthly.states.errorTitle')}
              description={t('monthly.states.errorDescription')}
              action={<Button variant="outline" onClick={() => reportQuery.refetch()}>{t('weekly.actions.retry')}</Button>}
            />
          )}

          {!reportQuery.isLoading && !reportQuery.isError && report && (
            <ReportMetricCards totals={report.totals} />
          )}
        </CardContent>
      </Card>

      {report && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <DayHighlight title={t('monthly.bestDay')} day={report.bestDay} icon={TrendingUp} />
            <DayHighlight title={t('monthly.weakestDay')} day={report.weakestDay} icon={TrendingDown} />
          </div>
          <MonthlyCalendar days={report.dayCards} />
          <ReportBreakdownTable items={report.worshipBreakdown} />
          <RewardList rewards={report.rewards} />
        </>
      )}
    </div>
  );
}
