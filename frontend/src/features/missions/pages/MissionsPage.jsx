import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Edit, Flag, Plus, Send, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { usePermissionContext } from '@/features/auth/hooks/usePermissionContext';

import { AssignMissionDialog } from '../components/AssignMissionDialog';
import { MissionFormDialog } from '../components/MissionFormDialog';
import { MissionService } from '../services/mission.service';

const MANAGE_PERMISSIONS = ['missions.manage_all', 'missions.manage_region'];
const CATALOG_PERMISSIONS = ['missions.manage_all', 'missions.manage_region', 'missions.assign'];

function MissionSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <Skeleton key={item} className="h-52 w-full rounded-xl" />
      ))}
    </div>
  );
}

function getMissionFromRow(row) {
  return row.mission ?? row;
}

function getAssignmentFromRow(row) {
  return row.mission ? row : row.assignment;
}

function getErrorMessage(error, t) {
  const code = error?.response?.data?.error?.code;
  if (code) return t(`errors.${code}`, { defaultValue: t('errors.default') });
  return t('errors.default');
}

function MissionCard({
  row,
  canManage,
  canAssign,
  onEdit,
  onAssign,
  onDeactivate,
  onComplete,
  completing,
  deactivating,
}) {
  const { t } = useTranslation(['missions']);
  const mission = getMissionFromRow(row);
  const assignment = getAssignmentFromRow(row);
  const completed = Boolean(assignment?.completed);
  const isCatalog = !row.mission;

  return (
    <Card className="overflow-hidden border-primary/10 bg-card/80">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-xl leading-7">{mission.title}</CardTitle>
            <CardDescription className="mt-2 leading-6">
              {mission.description || t('card.noDescription')}
            </CardDescription>
          </div>
          <div className="rounded-2xl bg-primary/15 p-3 text-primary">
            <Flag className="h-5 w-5" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={mission.isActive ? 'success' : 'secondary'}>
            {mission.isActive ? t('status.active') : t('status.inactive')}
          </Badge>
          <Badge variant={completed ? 'success' : 'secondary'}>
            {completed ? t('status.completed') : t('status.pending')}
          </Badge>
          <Badge variant="outline">
            {t('card.xp', { xp: mission.bonusXP ?? 0 })}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {assignment && (
          <div className="rounded-lg border border-border bg-background/60 p-3 text-sm text-muted-foreground">
            <p>{t('card.progress', { progress: assignment.progress ?? 0 })}</p>
            {assignment.completionDate && (
              <p>{t('card.completedAt', { date: new Date(assignment.completionDate).toLocaleDateString() })}</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {!isCatalog && !completed && (
            <Button type="button" onClick={() => onComplete(mission.id)} disabled={completing}>
              <CheckCircle2 className="h-4 w-4" />
              {completing ? t('actions.completing') : t('actions.complete')}
            </Button>
          )}

          {canAssign && (
            <Button type="button" variant="outline" onClick={() => onAssign(mission)}>
              <Send className="h-4 w-4" />
              {t('actions.assign')}
            </Button>
          )}

          {canManage && (
            <>
              <Button type="button" variant="outline" onClick={() => onEdit(mission)}>
                <Edit className="h-4 w-4" />
                {t('actions.edit')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDeactivate(mission.id)}
                disabled={deactivating || !mission.isActive}
              >
                <Trash2 className="h-4 w-4" />
                {deactivating ? t('actions.deactivating') : t('actions.deactivate')}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MissionsPage() {
  const { t } = useTranslation(['missions']);
  const queryClient = useQueryClient();
  const { hasAnyPermission } = usePermissionContext();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);
  const [missionToAssign, setMissionToAssign] = useState(null);

  const canManage = hasAnyPermission(MANAGE_PERMISSIONS);
  const canAssign = hasAnyPermission(CATALOG_PERMISSIONS);
  const includeCatalog = hasAnyPermission(CATALOG_PERMISSIONS);

  const missionsQuery = useQuery({
    queryKey: ['missions', includeCatalog ? 'catalog' : 'mine'],
    queryFn: () => MissionService.list(includeCatalog ? {} : { mine: true }),
  });

  const missions = useMemo(() => missionsQuery.data?.missions ?? [], [missionsQuery.data?.missions]);

  const completeMutation = useMutation({
    mutationFn: (missionId) => MissionService.complete(missionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['missions', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['me', 'notifications'] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (missionId) => MissionService.deactivate(missionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });

  const stats = useMemo(() => {
    const assignedRows = missions.filter((mission) => mission.mission);
    const completedRows = assignedRows.filter((mission) => mission.completed);

    return {
      total: missions.length,
      assigned: assignedRows.length,
      completed: completedRows.length,
    };
  }, [missions]);

  const openCreate = () => {
    setSelectedMission(null);
    setFormOpen(true);
  };

  const openEdit = (mission) => {
    setSelectedMission(mission);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary rtl:normal-case rtl:tracking-normal">
            {t('eyebrow')}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t('title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t(includeCatalog ? 'description.catalog' : 'description.user')}
          </p>
        </div>

        {canManage && (
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('actions.create')}
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('stats.total')}</p>
            <p className="mt-2 text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('stats.assigned')}</p>
            <p className="mt-2 text-2xl font-bold">{stats.assigned}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('stats.completed')}</p>
            <p className="mt-2 text-2xl font-bold">{stats.completed}</p>
          </CardContent>
        </Card>
      </div>

      {missionsQuery.isLoading && <MissionSkeleton />}

      {missionsQuery.isError && (
        <EmptyState
          icon={Flag}
          title={t('states.errorTitle')}
          description={getErrorMessage(missionsQuery.error, t)}
          action={(
            <Button type="button" variant="outline" onClick={() => missionsQuery.refetch()}>
              {t('actions.retry')}
            </Button>
          )}
        />
      )}

      {!missionsQuery.isLoading && !missionsQuery.isError && missions.length === 0 && (
        <EmptyState
          icon={Flag}
          title={t('states.emptyTitle')}
          description={t(includeCatalog ? 'states.emptyCatalog' : 'states.emptyUser')}
          action={canManage ? (
            <Button type="button" onClick={openCreate}>
              {t('actions.create')}
            </Button>
          ) : null}
        />
      )}

      {!missionsQuery.isLoading && !missionsQuery.isError && missions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {missions.map((row) => {
            const mission = getMissionFromRow(row);
            return (
              <MissionCard
                key={row.id}
                row={row}
                canManage={canManage}
                canAssign={canAssign}
                onEdit={openEdit}
                onAssign={setMissionToAssign}
                onDeactivate={(missionId) => deactivateMutation.mutate(missionId)}
                onComplete={(missionId) => completeMutation.mutate(missionId)}
                completing={completeMutation.isPending && completeMutation.variables === mission.id}
                deactivating={deactivateMutation.isPending && deactivateMutation.variables === mission.id}
              />
            );
          })}
        </div>
      )}

      {completeMutation.isError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {getErrorMessage(completeMutation.error, t)}
        </p>
      )}

      <MissionFormDialog
        mission={selectedMission}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <AssignMissionDialog
        mission={missionToAssign}
        open={Boolean(missionToAssign)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setMissionToAssign(null);
        }}
      />
    </div>
  );
}
