import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, FileBarChart2, Search, ShieldAlert, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

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
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissionContext } from '@/features/auth/hooks/usePermissionContext';
import { getUserInitials } from '@/lib/user';
import { apiClient } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';

import { MentorFeedbackCard } from '../components/MentorFeedbackCard';
import { ReportSummaryCards } from '../components/ReportSummaryCards';
import { StreakStatusCard } from '../components/StreakStatusCard';
import { WeekComparisonCard } from '../components/WeekComparisonCard';
import {
  WeekNavigator,
} from '../components/WeekNavigator';
import { WorshipBreakdownTable } from '../components/WorshipBreakdownTable';
import { WeeklyReportService } from '../services/weekly-report.service';
import { getMostRecentClosedWeekStartKey } from '../utils/week-date';

const VIEW_OTHER_PERMISSIONS = [
  'reports.view_assigned',
  'reports.view_region',
  'reports.view_all',
];

function getApiErrorCode(error) {
  return error?.response?.data?.error?.code;
}

function getErrorStatus(error) {
  return error?.response?.status;
}

async function searchReportUsers({
  authUser,
  canViewAssigned,
  canViewRegionOrAll,
  search,
}) {
  if (canViewRegionOrAll) {
    const response = await apiClient.get('/admin/users', {
      params: {
        search,
        limit: 8,
      },
    });

    return response.data.data;
  }

  if (canViewAssigned && authUser?.id) {
    const response = await apiClient.get(`/admin/mentors/${authUser.id}/users`);
    const normalizedSearch = search.trim().toLowerCase();

    return response.data.data
      .map((assignmentUser) => assignmentUser.user ?? assignmentUser)
      .filter((user) => {
        if (!normalizedSearch) return true;
        return `${user.fullName ?? ''} ${user.email ?? ''}`.toLowerCase().includes(normalizedSearch);
      })
      .slice(0, 8);
  }

  return [];
}

function WeeklyReportSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-36 w-full" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

function ReportState({ error, onRetry }) {
  const { t } = useTranslation(['reports']);
  const code = getApiErrorCode(error);
  const status = getErrorStatus(error);

  if (code === 'WEEK_NOT_CLOSED') {
    return (
      <EmptyState
        icon={FileBarChart2}
        title={t('weekly.states.weekNotClosedTitle')}
        description={t('weekly.states.weekNotClosedDescription')}
      />
    );
  }

  if (status === 403) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title={t('weekly.states.forbiddenTitle')}
        description={t('weekly.states.forbiddenDescription')}
      />
    );
  }

  return (
    <EmptyState
      icon={AlertTriangle}
      title={t('weekly.states.errorTitle')}
      description={t('weekly.states.errorDescription')}
      action={(
        <Button type="button" variant="outline" onClick={onRetry}>
          {t('weekly.actions.retry')}
        </Button>
      )}
    />
  );
}

function UserSearch({ onSelect, selectedUser }) {
  const { t } = useTranslation(['reports']);
  const authUser = useAuthStore((state) => state.user);
  const { hasPermission } = usePermissionContext();
  const [search, setSearch] = useState('');
  const canViewAssigned = hasPermission('reports.view_assigned');
  const canViewRegionOrAll = hasPermission('reports.view_region') || hasPermission('reports.view_all');

  const usersQuery = useQuery({
    queryKey: ['reports', 'weekly', 'user-search', search, canViewAssigned, canViewRegionOrAll, authUser?.id],
    queryFn: () => searchReportUsers({
      authUser,
      canViewAssigned,
      canViewRegionOrAll,
      search,
    }),
    enabled: search.trim().length >= 2,
  });

  const users = usersQuery.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('weekly.userSearch.title')}</CardTitle>
        <CardDescription>{t('weekly.userSearch.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Label htmlFor="weekly-report-user-search">{t('weekly.userSearch.label')}</Label>
        <div className="relative">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="weekly-report-user-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="ps-9"
            placeholder={t('weekly.userSearch.placeholder')}
          />
        </div>

        {usersQuery.isLoading && <Skeleton className="h-20 w-full" />}

        {!usersQuery.isLoading && users.length > 0 && (
          <div className="app-scrollbar max-h-52 overflow-y-auto rounded-md border border-input">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => onSelect(user)}
                className="flex w-full flex-col px-3 py-2 text-start text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="font-medium">{user.fullName}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </button>
            ))}
          </div>
        )}

        {selectedUser && (
          <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
            {t('weekly.userSearch.selected', { name: selectedUser.fullName })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ViewedUserBanner({ viewedUser }) {
  const { t } = useTranslation(['reports']);
  const initials = viewedUser ? getUserInitials(viewedUser.fullName) : null;

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
          {initials || <UserRound className="h-5 w-5" aria-hidden="true" />}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-card-foreground">
            {viewedUser
              ? t('weekly.viewedUser.reportFor', { name: viewedUser.fullName })
              : t('weekly.viewedUser.personalReport')}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {viewedUser?.email || t('weekly.viewedUser.personalDescription')}
          </p>
        </div>
      </div>
    </div>
  );
}

export function WeeklyReportPage() {
  const { t } = useTranslation(['reports']);
  const { hasAnyPermission } = usePermissionContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialWeekStartDate = searchParams.get('weekStartDate') ?? getMostRecentClosedWeekStartKey();
  const initialUserId = searchParams.get('userId');
  const [weekStartDate, setWeekStartDate] = useState(initialWeekStartDate);
  const [targetUserId, setTargetUserId] = useState(initialUserId);
  const [selectedUser, setSelectedUser] = useState(null);
  const canViewOtherUsers = hasAnyPermission(VIEW_OTHER_PERMISSIONS);

  const updateWeekStartDate = (nextWeekStartDate) => {
    setWeekStartDate(nextWeekStartDate);
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set('weekStartDate', nextWeekStartDate);
      return nextParams;
    });
  };

  const reportQuery = useQuery({
    queryKey: ['reports', 'weekly', weekStartDate, targetUserId],
    queryFn: () => WeeklyReportService.getWeekly({
      weekStartDate,
      ...(targetUserId ? { userId: targetUserId } : {}),
    }),
  });

  const report = reportQuery.data;
  const reportData = report?.data;
  const pageDescription = useMemo(() => {
    if (selectedUser) {
      return t('weekly.descriptionForUser', { name: selectedUser.fullName });
    }

    return t('weekly.description');
  }, [selectedUser, t]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary rtl:normal-case rtl:tracking-normal">
            {t('weekly.eyebrow')}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t('weekly.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {pageDescription}
          </p>
        </div>
      </div>

      {canViewOtherUsers && (
        <UserSearch
          selectedUser={selectedUser}
          onSelect={(user) => {
            setSelectedUser(user);
            setTargetUserId(user.id);
            setSearchParams((currentParams) => {
              const nextParams = new URLSearchParams(currentParams);
              nextParams.set('userId', user.id);
              nextParams.set('weekStartDate', weekStartDate);
              return nextParams;
            });
          }}
        />
      )}

      <WeekNavigator value={weekStartDate} onChange={updateWeekStartDate} />

      {reportQuery.isLoading && <WeeklyReportSkeleton />}

      {reportQuery.isError && (
        <ReportState error={reportQuery.error} onRetry={() => reportQuery.refetch()} />
      )}

      {!reportQuery.isLoading && !reportQuery.isError && reportData && (
        <div className="space-y-6">
          <ViewedUserBanner viewedUser={targetUserId ? (selectedUser ?? reportData.user) : null} />
          <ReportSummaryCards totals={reportData.totals} />

          <div className="grid gap-4 lg:grid-cols-2">
            <StreakStatusCard streak={reportData.streak} />
            <WeekComparisonCard comparison={reportData.comparison} />
          </div>

          <WorshipBreakdownTable
            items={reportData.worshipBreakdown}
            dailyBreakdown={reportData.dailyWorshipBreakdown}
            week={reportData.week}
          />
          <MentorFeedbackCard feedback={reportData.mentorFeedback} />
        </div>
      )}
    </div>
  );
}
