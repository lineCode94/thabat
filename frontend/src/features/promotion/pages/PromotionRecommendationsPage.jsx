import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Eye, Search, TrendingUp, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CriteriaList } from '@/features/promotion/components/CriteriaList';
import { PromotionStatusBadge } from '@/features/promotion/components/PromotionStatusBadge';
import { PromotionService } from '@/features/promotion/services/promotion.service';

function UsersTableSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-14 w-full" />)}
    </div>
  );
}

export function PromotionRecommendationsPage() {
  const { t } = useTranslation(['promotion']);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reason, setReason] = useState('');

  const usersQuery = useQuery({
    queryKey: ['promotion-users', search, page],
    queryFn: () => PromotionService.listPromotionUsers({
      page,
      limit: 20,
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
  });

  const promotionsQuery = useQuery({
    queryKey: ['promotions'],
    queryFn: () => PromotionService.listPromotions({ limit: 20 }),
  });

  const readinessQuery = useQuery({
    queryKey: ['promotionReadiness', selectedUser?.id],
    queryFn: () => PromotionService.getReadiness(selectedUser.id),
    enabled: Boolean(selectedUser?.id),
  });

  const createMutation = useMutation({
    mutationFn: () => PromotionService.createRecommendation(selectedUser.id, { reason }),
    onSuccess: (promotion) => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-users'] });
      setSelectedUser(null);
      navigate(`/promotions/${promotion.id}`);
    },
  });

  const users = usersQuery.data?.data ?? [];
  const pagination = usersQuery.data?.meta?.pagination;
  const promotions = promotionsQuery.data?.data ?? [];
  const readiness = readinessQuery.data;
  const passedCount = useMemo(
    () => readiness?.criteria?.filter((criterion) => criterion.passed).length ?? 0,
    [readiness?.criteria],
  );

  const openReadiness = (user) => {
    setReason('');
    setSelectedUser(user);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-md border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t('eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{t('title')}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">{t('description')}</p>
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>{t('users.title', { defaultValue: 'Users ready for review' })}</CardTitle>
              <CardDescription>
                {t('users.description', { defaultValue: 'Open a readiness report for each user and decide whether to recommend promotion.' })}
              </CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
                placeholder={t('users.searchPlaceholder', { defaultValue: 'Search users by name or email' })}
                className="ps-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usersQuery.isLoading && <UsersTableSkeleton />}

          {usersQuery.isError && (
            <EmptyState
              icon={Users}
              title={t('states.error')}
              description={t('users.errorDescription', { defaultValue: 'Could not load users available for promotion review.' })}
            />
          )}

          {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 && (
            <EmptyState
              icon={Users}
              title={t('users.emptyTitle', { defaultValue: 'No users found' })}
              description={t('users.emptyDescription', { defaultValue: 'Try changing the search or assignment filters.' })}
            />
          )}

          {!usersQuery.isLoading && !usersQuery.isError && users.length > 0 && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('users.name', { defaultValue: 'Name' })}</TableHead>
                    <TableHead>{t('users.email', { defaultValue: 'Email' })}</TableHead>
                    <TableHead>{t('users.region', { defaultValue: 'Region' })}</TableHead>
                    <TableHead>{t('users.currentLevel', { defaultValue: 'Current level' })}</TableHead>
                    <TableHead>{t('users.pending', { defaultValue: 'Pending recommendation' })}</TableHead>
                    <TableHead className="text-end">{t('users.actions', { defaultValue: 'Actions' })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.region?.name ?? '-'}</TableCell>
                      <TableCell>{user.currentLevel?.name ?? '-'}</TableCell>
                      <TableCell>
                        {user.pendingPromotion ? (
                          <Badge variant="secondary">
                            {user.pendingPromotion.nextLevel?.name ?? t('status.PENDING')}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-end">
                        <Button type="button" variant="outline" size="sm" onClick={() => openReadiness(user)}>
                          <Eye className="h-4 w-4" />
                          {t('actions.openReport', { defaultValue: 'Open report' })}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination && (
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  >
                    {t('pagination.previous', { defaultValue: 'Previous' })}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    {t('pagination.next', { defaultValue: 'Next' })}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('recent.title', { defaultValue: 'Recent promotion recommendations' })}</CardTitle>
          <CardDescription>{t('recent.description', { defaultValue: 'Track pending, approved, and declined promotion decisions.' })}</CardDescription>
        </CardHeader>
        <CardContent>
          <section className="grid gap-4 md:grid-cols-2">
            {promotions.map((promotion) => (
              <Link key={promotion.id} to={`/promotions/${promotion.id}`} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary/40 dark:border-slate-800 dark:bg-slate-950">
                <PromotionStatusBadge status={promotion.status} />
                <h2 className="mt-3 text-base font-semibold text-slate-950 dark:text-white">{promotion.user.fullName}</h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span>{promotion.previousLevel.name}</span>
                  <ArrowRight className="rtl:rotate-180" size={15} />
                  <span>{promotion.nextLevel.name}</span>
                </p>
              </Link>
            ))}
          </section>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('readinessTitle')}</DialogTitle>
            <DialogDescription>
              {selectedUser?.fullName} · {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          {readinessQuery.isLoading && <Skeleton className="h-80 w-full" />}

          {readinessQuery.isError && (
            <EmptyState icon={TrendingUp} title={t('states.error')} description={t('users.reportError', { defaultValue: 'Could not load the readiness report.' })} />
          )}

          {readiness && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border p-4">
                  <p className="text-sm text-muted-foreground">{t('users.progress', { defaultValue: 'Progress' })}</p>
                  <p className="mt-2 text-2xl font-bold text-primary">{readiness.progress}%</p>
                </div>
                <div className="rounded-md border p-4">
                  <p className="text-sm text-muted-foreground">{t('users.passedCriteria', { defaultValue: 'Passed criteria' })}</p>
                  <p className="mt-2 text-2xl font-bold">{passedCount}/{readiness.criteria.length}</p>
                </div>
                <div className="rounded-md border p-4">
                  <p className="text-sm text-muted-foreground">{t('users.decision', { defaultValue: 'Decision' })}</p>
                  <Badge variant={readiness.eligible ? 'success' : 'secondary'} className="mt-2">
                    {readiness.eligible
                      ? t('users.eligible', { defaultValue: 'Eligible' })
                      : t('users.notEligible', { defaultValue: 'Not eligible yet' })}
                  </Badge>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <p className="text-sm font-semibold">
                  {readiness.currentLevel.name}
                  <ArrowRight className="mx-2 inline rtl:rotate-180" size={16} />
                  {readiness.recommendedLevel.name}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('users.streakContext', {
                    defaultValue: 'Current streak: {{current}} · Longest streak: {{longest}} · Tracking completion: {{completion}}%',
                    current: readiness.context.currentStreak,
                    longest: readiness.context.longestStreak,
                    completion: readiness.context.trackingCompletionPercent,
                  })}
                </p>
              </div>

              <CriteriaList criteria={readiness.criteria} />

              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t('reasonPlaceholder')}
                className="min-h-24 w-full rounded-md border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950"
              />

              <div className="flex justify-end">
                <Button
                  type="button"
                  disabled={!readiness.eligible || createMutation.isPending || selectedUser?.pendingPromotion}
                  onClick={() => createMutation.mutate()}
                >
                  {t('actions.createRecommendation')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
