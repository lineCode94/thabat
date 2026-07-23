import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus } from 'lucide-react';
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
import { Input } from '@/components/ui/input';

import { WorshipLevelService } from '../services/worship-level.service';

function getCurrentLevelName(user) {
  return user.userLevels?.[0]?.worshipLevel?.name ?? null;
}

export function AssignWorshipLevelDialog({ level, open, onOpenChange }) {
  const { t } = useTranslation(['admin']);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const usersQuery = useQuery({
    queryKey: ['worship-levels', 'assignable-users', search],
    queryFn: () => WorshipLevelService.listAssignableUsers(search ? { search } : {}),
    enabled: open,
  });

  const users = usersQuery.data ?? [];
  const selectedSet = useMemo(() => new Set(selectedUserIds), [selectedUserIds]);

  const assignMutation = useMutation({
    mutationFn: () => WorshipLevelService.assignUsers(level.id, selectedUserIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'worship-levels'] });
      queryClient.invalidateQueries({ queryKey: ['worship-levels', 'assignable-users'] });
      queryClient.invalidateQueries({ queryKey: ['trackingDay'] });
      setSelectedUserIds([]);
      onOpenChange(false);
    },
  });

  const toggleUser = (userId) => {
    setSelectedUserIds((current) => (
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    ));
  };

  const closeDialog = (nextOpen) => {
    if (!assignMutation.isPending) {
      assignMutation.reset();
      setSelectedUserIds([]);
      onOpenChange(nextOpen);
    }
  };

  if (!level) return null;

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('worshipLevels.assign.title', { level: level.name })}</DialogTitle>
          <DialogDescription>{t('worshipLevels.assign.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('worshipLevels.assign.searchPlaceholder')}
              className="ps-9"
            />
          </div>

          <div className="app-scrollbar max-h-80 space-y-2 overflow-y-auto rounded-xl border p-2">
            {usersQuery.isLoading && (
              <p className="p-4 text-center text-sm text-muted-foreground">
                {t('worshipLevels.assign.loadingUsers')}
              </p>
            )}
            {!usersQuery.isLoading && users.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">
                {t('worshipLevels.assign.emptyUsers')}
              </p>
            )}
            {users.map((user) => {
              const selected = selectedSet.has(user.id);
              const currentLevelName = getCurrentLevelName(user);

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggleUser(user.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-start transition ${
                    selected
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent bg-slate-50 hover:border-primary/30 dark:bg-slate-900'
                  }`}
                >
                  <span>
                    <span className="block font-semibold">{user.fullName}</span>
                    <span className="block text-xs text-muted-foreground">{user.email}</span>
                    <span className="block text-xs text-muted-foreground">
                      {currentLevelName
                        ? t('worshipLevels.assign.currentLevel', { level: currentLevelName })
                        : t('worshipLevels.assign.noCurrentLevel')}
                    </span>
                  </span>
                  <span className={`h-5 w-5 rounded-full border ${selected ? 'border-primary bg-primary' : 'border-slate-400'}`} />
                </button>
              );
            })}
          </div>

          {assignMutation.isError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {t('worshipLevels.assign.error')}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => closeDialog(false)} disabled={assignMutation.isPending}>
            {t('worshipLevels.actions.cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => assignMutation.mutate()}
            disabled={assignMutation.isPending || selectedUserIds.length === 0}
          >
            <UserPlus className="h-4 w-4" />
            {assignMutation.isPending
              ? t('worshipLevels.assign.assigning')
              : t('worshipLevels.assign.assignSelected', { count: selectedUserIds.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
