import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, RefreshCw, Search, UserPlus, Users, UserX } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AssignMentorDialog } from '@/features/admin/mentor-assignments/components/AssignMentorDialog';
import { MentorAssignmentService } from '@/features/admin/mentor-assignments/services/mentor-assignment.service';
import { RegionService } from '@/features/admin/regions/services/region.service';
import { usePermissionContext } from '@/features/auth/hooks/usePermissionContext';

import { DeactivateUserDialog } from '../components/DeactivateUserDialog';
import { TransferRegionDialog } from '../components/TransferRegionDialog';
import { UserFormDialog } from '../components/UserFormDialog';
import { AdminUserService } from '../services/admin-user.service';

const ALL_VALUE = 'all';

function UsersTableSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3, 4].map((item) => (
        <Skeleton key={item} className="h-14 w-full" />
      ))}
    </div>
  );
}

function UserStatusBadge({ active }) {
  const { t } = useTranslation(['admin']);

  return (
    <Badge variant={active ? 'success' : 'secondary'}>
      {active ? t('users.status.active') : t('users.status.inactive')}
    </Badge>
  );
}

function buildListParams(filters, page) {
  return {
    page,
    limit: 10,
    ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
    ...(filters.regionId !== ALL_VALUE ? { regionId: filters.regionId } : {}),
    ...(filters.role !== ALL_VALUE ? { role: filters.role } : {}),
    ...(filters.mentorId !== ALL_VALUE ? { mentorId: filters.mentorId } : {}),
    ...(filters.isActive !== ALL_VALUE ? { isActive: filters.isActive } : {}),
  };
}

function buildFixedAssignment(user, currentAssignment) {
  if (currentAssignment?.id) {
    return currentAssignment;
  }

  return {
    id: null,
    mentorId: '',
    student: user,
  };
}

export function UsersPage() {
  const { t } = useTranslation(['admin']);
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissionContext();
  const canManageAll = hasPermission('users.manage_all');
  const canTransferRegion = hasPermission('users.transfer_region');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    regionId: ALL_VALUE,
    role: ALL_VALUE,
    mentorId: ALL_VALUE,
    isActive: ALL_VALUE,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [statusDialog, setStatusDialog] = useState({ mode: 'deactivate', user: null });
  const [transferUser, setTransferUser] = useState(null);
  const [assignmentDialog, setAssignmentDialog] = useState({ open: false, assignment: null });

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', filters, page],
    queryFn: () => AdminUserService.list(buildListParams(filters, page)),
  });

  const users = useMemo(() => usersQuery.data?.users ?? [], [usersQuery.data?.users]);
  const pagination = usersQuery.data?.pagination;

  const rolesQuery = useQuery({
    queryKey: ['admin', 'users', 'roles'],
    queryFn: () => AdminUserService.listRoles(),
  });
  const roles = rolesQuery.data ?? [];

  const regionsQuery = useQuery({
    queryKey: ['admin', 'regions', 'user-filter'],
    queryFn: () => RegionService.list(),
    enabled: canManageAll,
  });

  const mentorsQuery = useQuery({
    queryKey: ['admin', 'mentors', 'user-filter'],
    queryFn: () => MentorAssignmentService.listMentors(),
  });

  const mentorAssignmentQueries = useQueries({
    queries: users.map((user) => ({
      queryKey: ['admin', 'mentor-assignments', 'current', user.id],
      queryFn: () => MentorAssignmentService.getUserCurrentAssignment(user.id),
      enabled: Boolean(user.id),
    })),
  });

  const assignmentByUserId = useMemo(() => {
    const map = new Map();
    users.forEach((user, index) => {
      map.set(user.id, mentorAssignmentQueries[index]?.data ?? null);
    });
    return map;
  }, [mentorAssignmentQueries, users]);

  const statusMutation = useMutation({
    mutationFn: ({ mode, user }) => (
      mode === 'reactivate'
        ? AdminUserService.reactivate(user.id)
        : AdminUserService.deactivate(user.id)
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setStatusDialog({ mode: 'deactivate', user: null });
    },
  });

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const openCreateDialog = () => {
    setSelectedUser(null);
    setFormOpen(true);
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setFormOpen(true);
  };

  const openStatusDialog = (user, mode) => {
    statusMutation.reset();
    setStatusDialog({ mode, user });
  };

  const openAssignmentDialog = (user) => {
    const currentAssignment = assignmentByUserId.get(user.id);
    setAssignmentDialog({
      open: true,
      assignment: buildFixedAssignment(user, currentAssignment),
    });
  };

  const closeAssignmentDialog = (open) => {
    setAssignmentDialog((current) => ({ ...current, open }));
    if (!open) {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentor-assignments'] });
    }
  };

  const closeStatusDialog = (open) => {
    if (!open) {
      statusMutation.reset();
      setStatusDialog({ mode: 'deactivate', user: null });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary rtl:normal-case rtl:tracking-normal">
            {t('users.eyebrow')}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t('users.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t('users.description')}
          </p>
        </div>
        <Button type="button" onClick={openCreateDialog}>
          <UserPlus className="h-4 w-4" />
          {t('users.actions.create')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('users.filters.title')}</CardTitle>
          <CardDescription>{t('users.filters.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(event) => updateFilter('search', event.target.value)}
                className="ps-9"
                placeholder={t('users.filters.search')}
              />
            </div>

            {canManageAll && (
              <Select value={filters.regionId} onValueChange={(value) => updateFilter('regionId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('users.filters.region')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>{t('users.filters.allRegions')}</SelectItem>
                  {(regionsQuery.data ?? []).map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={filters.role} onValueChange={(value) => updateFilter('role', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('users.filters.role')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>{t('users.filters.allRoles')}</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.code}>
                    {t(`users.roles.${role.code}`, { defaultValue: role.name })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.mentorId} onValueChange={(value) => updateFilter('mentorId', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('users.filters.mentor')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>{t('users.filters.allMentors')}</SelectItem>
                {(mentorsQuery.data ?? []).map((mentor) => (
                  <SelectItem key={mentor.id} value={mentor.id}>
                    {mentor.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.isActive} onValueChange={(value) => updateFilter('isActive', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('users.filters.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>{t('users.filters.allStatuses')}</SelectItem>
                <SelectItem value="true">{t('users.status.active')}</SelectItem>
                <SelectItem value="false">{t('users.status.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('users.table.title')}</CardTitle>
          <CardDescription>{t('users.table.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {usersQuery.isLoading && <UsersTableSkeleton />}

          {usersQuery.isError && (
            <EmptyState
              icon={Users}
              title={t('users.states.errorTitle')}
              description={t('users.states.errorDescription')}
              action={(
                <Button type="button" variant="outline" onClick={() => usersQuery.refetch()}>
                  {t('users.actions.retry')}
                </Button>
              )}
            />
          )}

          {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 && (
            <EmptyState
              icon={Users}
              title={t('users.states.emptyTitle')}
              description={t('users.states.emptyDescription')}
              action={(
                <Button type="button" onClick={openCreateDialog}>
                  {t('users.actions.create')}
                </Button>
              )}
            />
          )}

          {!usersQuery.isLoading && !usersQuery.isError && users.length > 0 && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('users.table.name')}</TableHead>
                    <TableHead>{t('users.table.email')}</TableHead>
                    <TableHead>{t('users.table.role')}</TableHead>
                    <TableHead>{t('users.table.region')}</TableHead>
                    <TableHead>{t('users.table.currentMentor')}</TableHead>
                    <TableHead>{t('users.table.status')}</TableHead>
                    <TableHead className="text-end">{t('users.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const currentAssignment = assignmentByUserId.get(user.id);
                    const mentorName = currentAssignment?.mentor?.fullName;

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <p className="font-medium">{user.fullName}</p>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{t(`users.roles.${user.role?.code}`, { defaultValue: user.role?.name })}</TableCell>
                        <TableCell>{user.region?.name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">
                              {mentorName ?? t('users.table.noMentor')}
                            </p>
                            <Button
                              type="button"
                              variant="link"
                              className="h-auto p-0 text-xs"
                              onClick={() => openAssignmentDialog(user)}
                            >
                              {mentorName
                                ? t('users.actions.reassignMentor')
                                : t('users.actions.assignMentor')}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <UserStatusBadge active={user.isActive} />
                        </TableCell>
                        <TableCell className="text-end">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="h-4 w-4" />
                              {t('users.actions.edit')}
                            </Button>
                            {canTransferRegion && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setTransferUser(user)}
                              >
                                <RefreshCw className="h-4 w-4" />
                                {t('users.actions.transferRegion')}
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className={user.isActive ? 'border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive' : ''}
                              onClick={() => openStatusDialog(user, user.isActive ? 'deactivate' : 'reactivate')}
                            >
                              <UserX className="h-4 w-4" />
                              {user.isActive ? t('users.actions.deactivate') : t('users.actions.reactivate')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {pagination && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {t('users.pagination.summary', {
                      page: pagination.page,
                      totalPages: pagination.totalPages,
                      total: pagination.total,
                    })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((current) => Math.max(current - 1, 1))}
                      disabled={page <= 1}
                    >
                      {t('users.pagination.previous')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((current) => current + 1)}
                      disabled={page >= pagination.totalPages}
                    >
                      {t('users.pagination.next')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <UserFormDialog
        user={selectedUser}
        roles={roles}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <DeactivateUserDialog
        user={statusDialog.user}
        mode={statusDialog.mode}
        open={Boolean(statusDialog.user)}
        onOpenChange={closeStatusDialog}
        onConfirm={() => statusMutation.mutate(statusDialog)}
        isPending={statusMutation.isPending}
        error={statusMutation.error}
      />

      <TransferRegionDialog
        user={transferUser}
        open={Boolean(transferUser)}
        onOpenChange={(open) => {
          if (!open) setTransferUser(null);
        }}
      />

      <AssignMentorDialog
        assignment={assignmentDialog.assignment}
        open={assignmentDialog.open}
        onOpenChange={closeAssignmentDialog}
      />
    </div>
  );
}
