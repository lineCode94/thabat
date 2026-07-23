import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Layers3, Plus, SlidersHorizontal, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
import { usePermissionContext } from '@/features/auth/hooks/usePermissionContext';

import { AssignWorshipLevelDialog } from '../components/AssignWorshipLevelDialog';
import { CustomizeUserScheduleDialog } from '../components/CustomizeUserScheduleDialog';
import { DeactivateWorshipLevelDialog } from '../components/DeactivateWorshipLevelDialog';
import { WorshipLevelFormDialog } from '../components/WorshipLevelFormDialog';
import { WorshipLevelService } from '../services/worship-level.service';

function WorshipLevelsSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-14 w-full" />
      ))}
    </div>
  );
}

function StatusBadge({ active }) {
  const { t } = useTranslation(['admin']);

  return (
    <Badge variant={active ? 'success' : 'secondary'}>
      {active ? t('worshipLevels.status.active') : t('worshipLevels.status.inactive')}
    </Badge>
  );
}

export function WorshipLevelsPage() {
  const { t } = useTranslation(['admin']);
  const { hasPermission } = usePermissionContext();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [levelToDeactivate, setLevelToDeactivate] = useState(null);
  const [levelToAssign, setLevelToAssign] = useState(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const canManageLevels = hasPermission('levels.manage');
  const canAssignLevels = hasPermission('levels.promote') || canManageLevels;

  const levelsQuery = useQuery({
    queryKey: ['admin', 'worship-levels'],
    queryFn: () => WorshipLevelService.list({ all: true }),
  });

  const levels = levelsQuery.data ?? [];

  const deactivateMutation = useMutation({
    mutationFn: (id) => WorshipLevelService.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'worship-levels'] });
      setLevelToDeactivate(null);
    },
  });

  const openCreate = () => {
    setSelectedLevel(null);
    setFormOpen(true);
  };

  const openEdit = (level) => {
    setSelectedLevel(level);
    setFormOpen(true);
  };

  const openDeactivate = (level) => {
    deactivateMutation.reset();
    setLevelToDeactivate(level);
  };

  const closeDeactivate = (nextOpen) => {
    if (!nextOpen) {
      deactivateMutation.reset();
      setLevelToDeactivate(null);
    }
  };

  const confirmDeactivate = () => {
    if (levelToDeactivate?.id) deactivateMutation.mutate(levelToDeactivate.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary rtl:normal-case rtl:tracking-normal">
            {t('worshipLevels.eyebrow')}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t('worshipLevels.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t('worshipLevels.description')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canAssignLevels && (
            <Button type="button" variant="outline" onClick={() => setCustomizeOpen(true)}>
              <SlidersHorizontal className="h-4 w-4" />
              {t('worshipLevels.actions.customizeSchedule')}
            </Button>
          )}
          {canManageLevels && (
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t('worshipLevels.actions.create')}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('worshipLevels.table.title')}</CardTitle>
          <CardDescription>{t('worshipLevels.table.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {levelsQuery.isLoading && <WorshipLevelsSkeleton />}

          {levelsQuery.isError && (
            <EmptyState
              icon={Layers3}
              title={t('worshipLevels.states.errorTitle')}
              description={t('worshipLevels.states.errorDescription')}
              action={(
                <Button type="button" variant="outline" onClick={() => levelsQuery.refetch()}>
                  {t('worshipLevels.actions.retry')}
                </Button>
              )}
            />
          )}

          {!levelsQuery.isLoading && !levelsQuery.isError && levels.length === 0 && (
            <EmptyState
              icon={Layers3}
              title={t('worshipLevels.states.emptyTitle')}
              description={t('worshipLevels.states.emptyDescription')}
              action={canManageLevels ? <Button type="button" onClick={openCreate}>{t('worshipLevels.actions.create')}</Button> : null}
            />
          )}

          {!levelsQuery.isLoading && !levelsQuery.isError && levels.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('worshipLevels.table.order')}</TableHead>
                  <TableHead>{t('worshipLevels.table.name')}</TableHead>
                  <TableHead>{t('worshipLevels.table.descriptionColumn')}</TableHead>
                  <TableHead>{t('worshipLevels.table.requirements')}</TableHead>
                  <TableHead>{t('worshipLevels.table.users')}</TableHead>
                  <TableHead>{t('worshipLevels.table.status')}</TableHead>
                  <TableHead className="text-end">{t('worshipLevels.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {levels.map((level) => (
                  <TableRow key={level.id}>
                    <TableCell className="font-semibold">{level.order}</TableCell>
                    <TableCell>
                      <p className="font-semibold">{level.name}</p>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-xl text-sm text-muted-foreground">
                        {level.description || t('worshipLevels.table.noDescription')}
                      </p>
                    </TableCell>
                    <TableCell>{level.requirementsCount ?? 0}</TableCell>
                    <TableCell>{level.userLevelsCount ?? 0}</TableCell>
                    <TableCell>
                      <StatusBadge active={level.isActive && !level.deletedAt} />
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-2">
                        {canAssignLevels && (
                          <Button type="button" variant="outline" size="sm" onClick={() => setLevelToAssign(level)}>
                            <UserPlus className="h-4 w-4" />
                            {t('worshipLevels.actions.assignUsers')}
                          </Button>
                        )}
                        {canManageLevels && (
                          <>
                            <Button type="button" variant="outline" size="sm" onClick={() => openEdit(level)}>
                              <Edit className="h-4 w-4" />
                              {t('worshipLevels.actions.edit')}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => openDeactivate(level)}
                              disabled={!level.isActive || Boolean(level.deletedAt)}
                            >
                              <Trash2 className="h-4 w-4" />
                              {t('worshipLevels.actions.deactivate')}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <WorshipLevelFormDialog
        level={selectedLevel}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <DeactivateWorshipLevelDialog
        level={levelToDeactivate}
        open={Boolean(levelToDeactivate)}
        onOpenChange={closeDeactivate}
        onConfirm={confirmDeactivate}
        isPending={deactivateMutation.isPending}
        error={deactivateMutation.error}
      />

      <AssignWorshipLevelDialog
        level={levelToAssign}
        open={Boolean(levelToAssign)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setLevelToAssign(null);
        }}
      />

      <CustomizeUserScheduleDialog
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
      />
    </div>
  );
}
