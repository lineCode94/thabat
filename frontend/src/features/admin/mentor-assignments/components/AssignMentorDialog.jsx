import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/services/api';

import { MentorAssignmentService } from '../services/mentor-assignment.service';

import { MentorSelect } from './MentorSelect';

async function searchUsers(search) {
  const response = await apiClient.get('/admin/users', {
    params: {
      search,
      limit: 8,
    },
  });

  return response.data.data;
}

export function AssignMentorDialog({ assignment = null, onOpenChange, open }) {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const fixedUser = assignment?.student ?? null;
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(fixedUser);
  const [mentorId, setMentorId] = useState('');

  useEffect(() => {
    setSelectedUser(fixedUser);
    setMentorId(assignment?.mentorId ?? '');
    setSearch('');
  }, [assignment, fixedUser, open]);

  const usersQuery = useQuery({
    queryKey: ['admin', 'mentor-assignments', 'user-search', search],
    queryFn: () => searchUsers(search),
    enabled: open && !fixedUser && search.trim().length >= 2,
  });

  const currentAssignmentQuery = useQuery({
    queryKey: ['admin', 'mentor-assignments', 'current', selectedUser?.id],
    queryFn: () => MentorAssignmentService.getUserCurrentAssignment(selectedUser.id),
    enabled: open && Boolean(selectedUser?.id),
  });

  const currentAssignment = fixedUser ? assignment : currentAssignmentQuery.data;
  const isReassign = Boolean(currentAssignment?.id);

  const mutation = useMutation({
    mutationFn: () => {
      if (isReassign) {
        return MentorAssignmentService.transfer(selectedUser.id, { mentorId });
      }

      return MentorAssignmentService.assign({
        userId: selectedUser.id,
        mentorId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentor-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentors'] });
      onOpenChange(false);
    },
  });

  const canSubmit = Boolean(selectedUser?.id && mentorId) && !mutation.isPending;
  const title = isReassign
    ? t('mentorAssignments.dialog.reassignTitle')
    : t('mentorAssignments.dialog.assignTitle');
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {t('mentorAssignments.dialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="mentor-assignment-user-search">
              {t('mentorAssignments.form.user')}
            </Label>
            {fixedUser ? (
              <div className="rounded-md border border-input bg-muted/40 px-3 py-2 text-sm">
                <p className="font-medium">{fixedUser.fullName}</p>
                <p className="text-xs text-muted-foreground">{fixedUser.email}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="mentor-assignment-user-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="ps-9"
                    placeholder={t('mentorAssignments.form.userSearchPlaceholder')}
                  />
                </div>

                {usersQuery.isLoading && <Skeleton className="h-20 w-full" />}

                {!usersQuery.isLoading && users.length > 0 && (
                  <div className="app-scrollbar max-h-48 overflow-y-auto rounded-md border border-input">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(user);
                          setMentorId('');
                        }}
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
                    {t('mentorAssignments.form.selectedUser', { name: selectedUser.fullName })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('mentorAssignments.form.mentor')}</Label>
            <MentorSelect
              value={mentorId}
              onValueChange={setMentorId}
              regionId={selectedUser?.regionId}
              disabled={mutation.isPending}
            />
          </div>

          {mutation.isError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {mutation.error?.response?.data?.message ?? t('mentorAssignments.states.saveError')}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common:actions.cancel')}
          </Button>
          <Button type="button" disabled={!canSubmit} onClick={() => mutation.mutate()}>
            {mutation.isPending
              ? t('mentorAssignments.actions.saving')
              : t('mentorAssignments.actions.saveAssignment')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
