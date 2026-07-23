import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Link2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

import { AssignMentorDialog } from '../components/AssignMentorDialog';
import { AssignmentStatusBadge } from '../components/AssignmentStatusBadge';
import { MentorAssignmentService } from '../services/mentor-assignment.service';

function formatDate(value, language) {
  if (!value) return '';

  return new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function AssignmentTableSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function MentorAssignmentsPage() {
  const { i18n, t } = useTranslation(['admin']);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentToDeactivate, setAssignmentToDeactivate] = useState(null);

  const assignmentsQuery = useQuery({
    queryKey: ['admin', 'mentor-assignments', 'active'],
    queryFn: () => MentorAssignmentService.list(),
  });

  const assignments = assignmentsQuery.data ?? [];

  const deactivateMutation = useMutation({
    mutationFn: (assignmentId) => MentorAssignmentService.deactivate(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentor-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentors'] });
      setAssignmentToDeactivate(null);
    },
  });

  const openAssignDialog = () => {
    setSelectedAssignment(null);
    setDialogOpen(true);
  };

  const openReassignDialog = (assignment) => {
    setSelectedAssignment(assignment);
    setDialogOpen(true);
  };

  const closeDeactivateDialog = () => {
    if (!deactivateMutation.isPending) {
      setAssignmentToDeactivate(null);
      deactivateMutation.reset();
    }
  };

  const confirmDeactivate = () => {
    if (assignmentToDeactivate?.id) {
      deactivateMutation.mutate(assignmentToDeactivate.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary rtl:normal-case rtl:tracking-normal">
            {t('mentorAssignments.eyebrow')}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t('mentorAssignments.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t('mentorAssignments.description')}
          </p>
        </div>
        <Button type="button" onClick={openAssignDialog}>
          <UserPlus className="h-4 w-4" />
          {t('mentorAssignments.actions.assign')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('mentorAssignments.table.title')}</CardTitle>
          <CardDescription>{t('mentorAssignments.table.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {assignmentsQuery.isLoading && <AssignmentTableSkeleton />}

          {assignmentsQuery.isError && (
            <EmptyState
              icon={Link2}
              title={t('mentorAssignments.states.errorTitle')}
              description={t('mentorAssignments.states.errorDescription')}
              action={(
                <Button type="button" variant="outline" onClick={() => assignmentsQuery.refetch()}>
                  {t('mentorAssignments.actions.retry')}
                </Button>
              )}
            />
          )}

          {!assignmentsQuery.isLoading && !assignmentsQuery.isError && assignments.length === 0 && (
            <EmptyState
              icon={Link2}
              title={t('mentorAssignments.states.emptyTitle')}
              description={t('mentorAssignments.states.emptyDescription')}
              action={(
                <Button type="button" onClick={openAssignDialog}>
                  {t('mentorAssignments.actions.assign')}
                </Button>
              )}
            />
          )}

          {!assignmentsQuery.isLoading && !assignmentsQuery.isError && assignments.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('mentorAssignments.table.user')}</TableHead>
                  <TableHead>{t('mentorAssignments.table.mentor')}</TableHead>
                  <TableHead>{t('mentorAssignments.table.region')}</TableHead>
                  <TableHead>{t('mentorAssignments.table.assignedAt')}</TableHead>
                  <TableHead>{t('mentorAssignments.table.status')}</TableHead>
                  <TableHead className="text-end">{t('mentorAssignments.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{assignment.student?.fullName}</p>
                        <p className="text-xs text-muted-foreground">{assignment.student?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{assignment.mentor?.fullName}</p>
                        <p className="text-xs text-muted-foreground">{assignment.mentor?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignment.student?.region?.name ?? assignment.mentor?.region?.name ?? assignment.student?.regionId}
                    </TableCell>
                    <TableCell>{formatDate(assignment.assignedAt, i18n.language)}</TableCell>
                    <TableCell>
                      <AssignmentStatusBadge active={assignment.isActive} />
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openReassignDialog(assignment)}
                        >
                          {t('mentorAssignments.actions.reassign')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setAssignmentToDeactivate(assignment)}
                        >
                          {t('mentorAssignments.actions.deactivate')}
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

      <AssignMentorDialog
        assignment={selectedAssignment}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <Dialog open={Boolean(assignmentToDeactivate)} onOpenChange={closeDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle>{t('mentorAssignments.deactivate.title')}</DialogTitle>
            <DialogDescription>
              {t('mentorAssignments.deactivate.description', {
                user: assignmentToDeactivate?.student?.fullName ?? '',
                mentor: assignmentToDeactivate?.mentor?.fullName ?? '',
              })}
            </DialogDescription>
          </DialogHeader>

          {deactivateMutation.isError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {t('mentorAssignments.states.deactivateError')}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeDeactivateDialog}
              disabled={deactivateMutation.isPending}
            >
              {t('mentorAssignments.deactivate.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeactivate}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending
                ? t('mentorAssignments.actions.deactivating')
                : t('mentorAssignments.deactivate.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
