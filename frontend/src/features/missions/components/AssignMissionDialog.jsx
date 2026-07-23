import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

import { MissionService } from '../services/mission.service';

function getErrorMessage(error, t) {
  const code = error?.response?.data?.error?.code;
  if (code) return t(`errors.${code}`, { defaultValue: t('errors.default') });
  return t('errors.default');
}

export function AssignMissionDialog({ mission, open, onOpenChange }) {
  const { t } = useTranslation(['missions']);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const usersQuery = useQuery({
    queryKey: ['missions', 'assignable-users', search],
    queryFn: () => MissionService.listAssignableUsers({ search, limit: 8 }),
    enabled: open && search.trim().length >= 2,
  });

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  const mutation = useMutation({
    mutationFn: () => MissionService.assign(mission.id, { userId: selectedUser.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['missions', 'summary'] });
      setSearch('');
      setSelectedUser(null);
      onOpenChange(false);
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('assign.title')}</DialogTitle>
          <DialogDescription>
            {t('assign.description', { title: mission?.title ?? '' })}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <label className="block space-y-2">
              <span className="text-sm font-medium">{t('assign.user')}</span>
              <span className="relative block">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-11 w-full rounded-lg border border-border bg-background ps-10 pe-3 text-sm outline-none transition focus:border-primary"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setSelectedUser(null);
                  }}
                  placeholder={t('assign.userSearchPlaceholder')}
                />
              </span>
            </label>

            {usersQuery.isLoading && <Skeleton className="h-20 w-full" />}

            {!usersQuery.isLoading && search.trim().length >= 2 && users.length === 0 && (
              <EmptyState
                icon={Search}
                title={t('assign.noUsersTitle')}
                description={t('assign.noUsersDescription')}
              />
            )}

            {!usersQuery.isLoading && users.length > 0 && (
              <div className="app-scrollbar max-h-56 overflow-y-auto rounded-lg border border-border">
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedUser(user);
                      setSearch(user.fullName);
                    }}
                    className="flex w-full flex-col gap-1 px-3 py-2 text-start text-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="font-medium">{user.fullName}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                      {user.region?.name ? ` · ${user.region.name}` : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {selectedUser && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
                {t('assign.selectedUser', { name: selectedUser.fullName })}
              </div>
            )}
          </div>

          {mutation.isError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getErrorMessage(mutation.error, t)}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending || !selectedUser?.id}>
              {mutation.isPending ? t('actions.assigning') : t('actions.assign')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
