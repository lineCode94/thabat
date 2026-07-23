import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Minus, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';

import { WorshipLevelService } from '../services/worship-level.service';

function groupItemsByCategory(items) {
  return items.reduce((groups, item) => {
    const categoryId = item.category?.id ?? 'uncategorized';
    const existing = groups.get(categoryId) ?? {
      id: categoryId,
      name: item.category?.name ?? 'Uncategorized',
      order: item.category?.order ?? 999,
      items: [],
    };

    existing.items.push(item);
    groups.set(categoryId, existing);
    return groups;
  }, new Map());
}

function UserSearchList({ users, selectedUserId, onSelect, loading }) {
  const { t } = useTranslation(['admin']);

  if (loading) {
    return <Skeleton className="h-28 w-full" />;
  }

  if (users.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
        {t('worshipLevels.customize.emptyUsers')}
      </p>
    );
  }

  return (
    <div className="app-scrollbar max-h-44 space-y-2 overflow-y-auto rounded-xl border p-2">
      {users.map((user) => {
        const selected = selectedUserId === user.id;
        const currentLevel = user.userLevels?.[0]?.worshipLevel?.name;

        return (
          <button
            key={user.id}
            type="button"
            onClick={() => onSelect(user)}
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
                {currentLevel
                  ? t('worshipLevels.customize.currentLevel', { level: currentLevel })
                  : t('worshipLevels.customize.noCurrentLevel')}
              </span>
            </span>
            {selected && <Check className="h-5 w-5 text-primary" />}
          </button>
        );
      })}
    </div>
  );
}

function ScheduleItem({ item, included, custom, excluded, onAdd, onRemove }) {
  const { t } = useTranslation(['admin']);

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-slate-50 px-3 py-2 text-sm dark:bg-slate-950/60">
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-950 dark:text-white">{item.title}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          <Badge variant="secondary">{t('worshipLevels.customize.points', { count: item.score ?? item.xp ?? 0 })}</Badge>
          {custom && <Badge>{t('worshipLevels.customize.customBadge')}</Badge>}
          {excluded && <Badge variant="destructive">{t('worshipLevels.customize.excludedBadge')}</Badge>}
        </div>
      </div>
      {included ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onRemove(item.id)}
        >
          <Minus className="h-4 w-4" />
          {t('worshipLevels.customize.remove')}
        </Button>
      ) : (
        <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => onAdd(item.id)}>
          <Plus className="h-4 w-4" />
          {t('worshipLevels.customize.add')}
        </Button>
      )}
    </div>
  );
}

export function CustomizeUserScheduleDialog({ open, onOpenChange }) {
  const { t } = useTranslation(['admin']);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [customItemIds, setCustomItemIds] = useState([]);
  const [excludedItemIds, setExcludedItemIds] = useState([]);

  const usersQuery = useQuery({
    queryKey: ['worship-levels', 'assignable-users', search],
    queryFn: () => WorshipLevelService.listAssignableUsers(search ? { search } : {}),
    enabled: open,
  });

  const scheduleQuery = useQuery({
    queryKey: ['worship-levels', 'custom-schedule', selectedUser?.id],
    queryFn: () => WorshipLevelService.getUserCustomSchedule(selectedUser.id),
    enabled: open && Boolean(selectedUser?.id),
  });

  const schedule = scheduleQuery.data;
  const baseItemIds = useMemo(() => new Set(schedule?.baseItemIds ?? []), [schedule?.baseItemIds]);
  const customSet = useMemo(() => new Set(customItemIds), [customItemIds]);
  const excludedSet = useMemo(() => new Set(excludedItemIds), [excludedItemIds]);
  const finalItems = useMemo(() => {
    if (!schedule) return [];
    const itemsById = new Map();

    schedule.availableItems.forEach((item) => {
      if (baseItemIds.has(item.id) && !excludedSet.has(item.id)) {
        itemsById.set(item.id, item);
      }
      if (customSet.has(item.id)) {
        itemsById.set(item.id, item);
      }
    });

    return [...itemsById.values()];
  }, [baseItemIds, customSet, excludedSet, schedule]);

  const groupedFinalItems = useMemo(() => (
    [...groupItemsByCategory(finalItems).values()].sort((a, b) => a.order - b.order)
  ), [finalItems]);

  const availableToAdd = useMemo(() => {
    if (!schedule) return [];
    const includedIds = new Set(finalItems.map((item) => item.id));
    return schedule.availableItems.filter((item) => !includedIds.has(item.id));
  }, [finalItems, schedule]);

  const groupedAvailableItems = useMemo(() => (
    [...groupItemsByCategory(availableToAdd).values()].sort((a, b) => a.order - b.order)
  ), [availableToAdd]);

  const saveMutation = useMutation({
    mutationFn: () => WorshipLevelService.updateUserCustomSchedule(selectedUser.id, {
      customItemIds,
      excludedItemIds,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worship-levels', 'custom-schedule', selectedUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['trackingDay'] });
      onOpenChange(false);
    },
  });

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setCustomItemIds([]);
    setExcludedItemIds([]);
    saveMutation.reset();
  };

  useEffect(() => {
    setCustomItemIds(schedule?.customItemIds ?? []);
    setExcludedItemIds(schedule?.excludedItemIds ?? []);
  }, [schedule?.customItemIds, schedule?.excludedItemIds]);

  const addItem = (itemId) => {
    if (baseItemIds.has(itemId)) {
      setExcludedItemIds((current) => current.filter((id) => id !== itemId));
      return;
    }
    setCustomItemIds((current) => (current.includes(itemId) ? current : [...current, itemId]));
  };

  const removeItem = (itemId) => {
    if (customSet.has(itemId)) {
      setCustomItemIds((current) => current.filter((id) => id !== itemId));
      return;
    }
    if (baseItemIds.has(itemId)) {
      setExcludedItemIds((current) => (current.includes(itemId) ? current : [...current, itemId]));
    }
  };

  const closeDialog = (nextOpen) => {
    if (!saveMutation.isPending) {
      setSearch('');
      setSelectedUser(null);
      setCustomItemIds([]);
      setExcludedItemIds([]);
      saveMutation.reset();
      onOpenChange(nextOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t('worshipLevels.customize.title')}</DialogTitle>
          <DialogDescription>{t('worshipLevels.customize.description')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('worshipLevels.customize.searchPlaceholder')}
                className="ps-9"
              />
            </div>

            <UserSearchList
              users={usersQuery.data ?? []}
              selectedUserId={selectedUser?.id}
              onSelect={handleSelectUser}
              loading={usersQuery.isLoading}
            />
          </div>

          <div className="min-h-[420px] rounded-xl border p-4">
            {!selectedUser && (
              <div className="flex h-full min-h-80 flex-col items-center justify-center text-center text-muted-foreground">
                <SlidersHorizontal className="mb-3 h-10 w-10" />
                <p className="font-semibold">{t('worshipLevels.customize.pickUserTitle')}</p>
                <p className="mt-1 text-sm">{t('worshipLevels.customize.pickUserDescription')}</p>
              </div>
            )}

            {selectedUser && scheduleQuery.isLoading && (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            )}

            {selectedUser && scheduleQuery.isError && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {t('worshipLevels.customize.loadError')}
              </p>
            )}

            {selectedUser && schedule && !scheduleQuery.isLoading && !scheduleQuery.isError && (
              <div className="space-y-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{schedule.user.fullName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('worshipLevels.customize.levelLine', { level: schedule.level.name })}
                    </p>
                  </div>
                  <Badge>{t('worshipLevels.customize.itemCount', { count: finalItems.length })}</Badge>
                </div>

                <div className="app-scrollbar max-h-[52vh] space-y-5 overflow-y-auto pe-1">
                  <section className="space-y-3">
                    <h4 className="font-semibold">{t('worshipLevels.customize.currentSchedule')}</h4>
                    {groupedFinalItems.length === 0 && (
                      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        {t('worshipLevels.customize.emptySchedule')}
                      </p>
                    )}
                    {groupedFinalItems.map((group) => (
                      <div key={group.id} className="space-y-2">
                        <p className="text-sm font-semibold text-primary">{group.name}</p>
                        {group.items.map((item) => (
                          <ScheduleItem
                            key={item.id}
                            item={item}
                            included
                            custom={customSet.has(item.id)}
                            excluded={false}
                            onAdd={addItem}
                            onRemove={removeItem}
                          />
                        ))}
                      </div>
                    ))}
                  </section>

                  <section className="space-y-3">
                    <h4 className="font-semibold">{t('worshipLevels.customize.availableToAdd')}</h4>
                    {groupedAvailableItems.length === 0 && (
                      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        {t('worshipLevels.customize.noAvailableItems')}
                      </p>
                    )}
                    {groupedAvailableItems.map((group) => (
                      <div key={group.id} className="space-y-2">
                        <p className="text-sm font-semibold text-primary">{group.name}</p>
                        {group.items.map((item) => (
                          <ScheduleItem
                            key={item.id}
                            item={item}
                            included={false}
                            custom={false}
                            excluded={excludedSet.has(item.id)}
                            onAdd={addItem}
                            onRemove={removeItem}
                          />
                        ))}
                      </div>
                    ))}
                  </section>
                </div>

                {saveMutation.isError && (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {t('worshipLevels.customize.saveError')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => closeDialog(false)} disabled={saveMutation.isPending}>
            {t('worshipLevels.actions.cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={!selectedUser || scheduleQuery.isLoading || saveMutation.isPending}
          >
            {saveMutation.isPending
              ? t('worshipLevels.customize.saving')
              : t('worshipLevels.customize.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
