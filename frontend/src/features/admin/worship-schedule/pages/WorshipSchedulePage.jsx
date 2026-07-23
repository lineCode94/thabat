import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpenCheck, Edit, Layers3, Plus, RefreshCw, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
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

import { CustomizeUserScheduleDialog } from '../../worship-levels/components/CustomizeUserScheduleDialog';
import { WorshipCategoryFormDialog } from '../components/WorshipCategoryFormDialog';
import { WorshipItemFormDialog } from '../components/WorshipItemFormDialog';
import { WorshipScheduleService } from '../services/worship-schedule.service';

function isInDailySchedule(item) {
  return (item.levelRequirements ?? []).some((requirement) => requirement.worshipLevel?.isActive);
}

function formatDays(item, t) {
  if (!item.daysOfWeek?.length) return t('worshipSchedule.form.everyDay');
  return item.daysOfWeek.map((day) => t(`worshipSchedule.days.${day}`)).join('، ');
}

function WorshipScheduleSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <Skeleton key={item} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function WorshipSchedulePage() {
  const { t } = useTranslation(['admin']);
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'worship-schedule', 'categories'],
    queryFn: () => WorshipScheduleService.listCategories(),
  });

  const itemsQuery = useQuery({
    queryKey: ['admin', 'worship-schedule', 'items'],
    queryFn: () => WorshipScheduleService.listItems(),
  });

  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  const scheduleStats = useMemo(() => {
    const scheduled = items.filter(isInDailySchedule).length;
    const active = items.filter((item) => item.isActive && !item.deletedAt).length;
    const points = items
      .filter((item) => item.isActive && !item.deletedAt && isInDailySchedule(item))
      .reduce((total, item) => total + Number(item.score ?? 0), 0);
    const counterTargets = items
      .filter((item) => item.inputType === 'COUNT' && item.targetValue)
      .length;
    return { scheduled, active, total: items.length, points, counterTargets };
  }, [items]);

  const scheduleMutation = useMutation({
    mutationFn: ({ itemId, next }) => WorshipScheduleService.setDailySchedule(itemId, next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'worship-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['trackingDay'] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (itemId) => WorshipScheduleService.deactivateItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'worship-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['trackingDay'] });
    },
  });

  const openCreate = () => {
    setSelectedItem(null);
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary rtl:normal-case rtl:tracking-normal">
            {t('worshipSchedule.eyebrow')}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t('worshipSchedule.title')}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {t('worshipSchedule.description')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setCustomizeOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" />
            {t('worshipSchedule.actions.customizeUser')}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/admin/worship-levels">
              <Layers3 className="h-4 w-4" />
              {t('worshipSchedule.actions.manageLevels')}
            </Link>
          </Button>
          <Button type="button" variant="outline" onClick={() => setCategoryFormOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('worshipSchedule.actions.createCategory')}
          </Button>
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('worshipSchedule.actions.createItem')}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('worshipSchedule.stats.scheduled')}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{scheduleStats.scheduled}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('worshipSchedule.stats.active')}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{scheduleStats.active}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('worshipSchedule.stats.total')}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{scheduleStats.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('worshipSchedule.stats.points')}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{scheduleStats.points}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('worshipSchedule.stats.targets')}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{scheduleStats.counterTargets}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('worshipSchedule.table.title')}</CardTitle>
          <CardDescription>{t('worshipSchedule.table.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {(itemsQuery.isLoading || categoriesQuery.isLoading) && <WorshipScheduleSkeleton />}

          {(itemsQuery.isError || categoriesQuery.isError) && (
            <EmptyState
              icon={RefreshCw}
              title={t('worshipSchedule.states.errorTitle')}
              description={t('worshipSchedule.states.errorDescription')}
              action={(
                <Button type="button" variant="outline" onClick={() => {
                  itemsQuery.refetch();
                  categoriesQuery.refetch();
                }}>
                  {t('worshipSchedule.actions.retry')}
                </Button>
              )}
            />
          )}

          {!itemsQuery.isLoading && !itemsQuery.isError && items.length === 0 && (
            <EmptyState
              icon={BookOpenCheck}
              title={t('worshipSchedule.states.emptyTitle')}
              description={t('worshipSchedule.states.emptyDescription')}
              action={<Button type="button" onClick={openCreate}>{t('worshipSchedule.actions.createItem')}</Button>}
            />
          )}

          {!itemsQuery.isLoading && !itemsQuery.isError && items.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('worshipSchedule.table.item')}</TableHead>
                  <TableHead>{t('worshipSchedule.table.category')}</TableHead>
                  <TableHead>{t('worshipSchedule.table.type')}</TableHead>
                  <TableHead>{t('worshipSchedule.table.points')}</TableHead>
                  <TableHead>{t('worshipSchedule.table.target')}</TableHead>
                  <TableHead>{t('worshipSchedule.table.xp')}</TableHead>
                  <TableHead>{t('worshipSchedule.table.days')}</TableHead>
                  <TableHead>{t('worshipSchedule.table.dailySchedule')}</TableHead>
                  <TableHead className="text-end">{t('worshipSchedule.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const scheduled = isInDailySchedule(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-semibold">{item.title}</p>
                        {!item.isActive && <p className="text-xs text-muted-foreground">{t('worshipSchedule.status.inactive')}</p>}
                      </TableCell>
                      <TableCell>{item.category?.name ?? '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{t(`worshipSchedule.inputTypes.${item.inputType}`)}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{item.score ?? 0}</TableCell>
                      <TableCell>{item.targetValue ?? t('worshipSchedule.table.noTarget')}</TableCell>
                      <TableCell>{item.xp ?? 0}</TableCell>
                      <TableCell>{formatDays(item, t)}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => scheduleMutation.mutate({ itemId: item.id, next: !scheduled })}
                          disabled={scheduleMutation.isPending}
                          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <Badge variant={scheduled ? 'success' : 'secondary'}>
                            {scheduled ? t('worshipSchedule.status.visibleToday') : t('worshipSchedule.status.notVisibleToday')}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(item)}>
                            <Edit className="h-4 w-4" />
                            {t('worshipSchedule.actions.edit')}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => deactivateMutation.mutate(item.id)}
                            disabled={!item.isActive || deactivateMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                            {t('worshipSchedule.actions.deactivate')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <WorshipItemFormDialog
        categories={categories}
        item={selectedItem}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
      <WorshipCategoryFormDialog open={categoryFormOpen} onOpenChange={setCategoryFormOpen} />
      <CustomizeUserScheduleDialog open={customizeOpen} onOpenChange={setCustomizeOpen} />
    </div>
  );
}
