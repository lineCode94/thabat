import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, Plus, Search, Trash2, X } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

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
import { AchievementDetailDialog } from '@/features/gamification/components/AchievementDetailDialog';
import { EarnedBadgesDialog } from '@/features/gamification/components/EarnedBadgesDialog';
import {
  playHighScoreSound,
  playLowScoreSound,
  playMidScoreSound,
  playStepSound,
  primeSoundEffects,
} from '@/lib/soundEffects';

import { PageCompletionAnimation } from '../components/PageCompletionAnimation';
import { TodayRewardsPanel } from '../components/TodayRewardsPanel';
import { TrackingRenderer } from '../components/TrackingRenderer';
import { TrackingSkeleton } from '../components/TrackingSkeleton';
import { WeeklyTrackingStrip } from '../components/WeeklyTrackingStrip';
import { TrackingService } from '../services/tracking.service';

function buildCompletedEntryForItem(item, previousEntry = {}) {
  const inputType = item.inputType?.toUpperCase();
  const targetValue = Number(item.targetValue ?? 0);

  if (inputType === 'COUNT') {
    return {
      ...previousEntry,
      count: targetValue > 0 ? targetValue : Math.max(Number(previousEntry.count ?? 0), 1),
      isCompleted: true,
    };
  }

  if (inputType === 'DURATION' || inputType === 'TIMER') {
    return {
      ...previousEntry,
      duration: targetValue > 0 ? targetValue : Math.max(Number(previousEntry.duration ?? 0), 1),
      isCompleted: true,
    };
  }

  return {
    ...previousEntry,
    isCompleted: true,
  };
}

function buildIncompleteEntryForItem(previousEntry = {}) {
  return {
    ...previousEntry,
    isCompleted: false,
    count: 0,
    duration: 0,
  };
}

const CATEGORY_FLOW_ORDER = [
  'Fajr',
  'الفجر',
  'الظهر',
  'العصر',
  'المغرب',
  'العشاء',
  'الليل',
  'القرآن',
  'أذكار وأعمال صالحة',
  'أعمال الجمعة',
  'أذكار وأعمال يومية',
];

function groupItemsIntoPages(items = []) {
  const groupedItems = items.reduce((groups, item) => {
    const categoryName = item.category?.name;
    if (!categoryName) return groups;

    const group = groups.get(categoryName) ?? {
      id: item.category?.id ?? categoryName,
      name: categoryName,
      items: [],
    };
    group.items.push(item);
    groups.set(categoryName, group);
    return groups;
  }, new Map());

  const orderedPages = CATEGORY_FLOW_ORDER
    .map((categoryName) => groupedItems.get(categoryName))
    .filter((page) => page?.items?.length > 0);

  const orderedNames = new Set(orderedPages.map((page) => page.name));
  const remainingPages = Array.from(groupedItems.values())
    .filter((page) => !orderedNames.has(page.name))
    .sort((first, second) => (first.name || '').localeCompare(second.name || ''));

  return [...orderedPages, ...remainingPages];
}

function groupItemsByCategory(items = []) {
  return [...items.reduce((groups, item) => {
    const categoryId = item.category?.id ?? 'uncategorized';
    const group = groups.get(categoryId) ?? {
      id: categoryId,
      name: item.category?.name ?? 'Uncategorized',
      order: item.category?.order ?? 999,
      items: [],
    };
    group.items.push(item);
    groups.set(categoryId, group);
    return groups;
  }, new Map()).values()].sort((first, second) => first.order - second.order);
}

function isItemCompleted(item, entry = {}) {
  const inputType = item.inputType?.toUpperCase();

  if (inputType === 'COUNT') {
    const count = Number(entry.count ?? 0);
    const targetValue = Number(item.targetValue ?? 0);
    return targetValue > 0 ? count >= targetValue : count > 0;
  }

  if (inputType === 'DURATION' || inputType === 'TIMER') {
    const duration = Number(entry.duration ?? 0);
    const targetValue = Number(item.targetValue ?? 0);
    return targetValue > 0 ? duration >= targetValue : duration > 0;
  }

  return Boolean(entry.isCompleted);
}

function calculatePageFeedback(page, entries) {
  const totalScore = page.items.reduce((total, item) => total + Number(item.score ?? 0), 0);
  const completedScore = page.items.reduce((total, item) => {
    const entry = entries[item.id] ?? {};
    return total + (isItemCompleted(item, entry) ? Number(item.score ?? 0) : 0);
  }, 0);
  const scorePercentage = totalScore > 0 ? Math.round((completedScore / totalScore) * 100) : 0;

  return {
    categoryName: page.name,
    completedScore,
    totalScore,
    scorePercentage,
  };
}

function calculatePageScore(page, entries) {
  if (!page) {
    return {
      completedScore: 0,
      totalScore: 0,
      scorePercentage: 0,
      completedItems: 0,
      totalItems: 0,
    };
  }

  const totalScore = page.items.reduce((total, item) => total + Number(item.score ?? 0), 0);
  const completedItems = page.items.filter((item) => isItemCompleted(item, entries[item.id] ?? {})).length;
  const completedScore = page.items.reduce((total, item) => {
    const entry = entries[item.id] ?? {};
    return total + (isItemCompleted(item, entry) ? Number(item.score ?? 0) : 0);
  }, 0);
  const scorePercentage = totalScore > 0 ? Math.round((completedScore / totalScore) * 100) : 0;

  return {
    completedScore,
    totalScore,
    scorePercentage,
    completedItems,
    totalItems: page.items.length,
  };
}

function calculateDayScore(items, entries) {
  const totalScore = items.reduce((total, item) => total + Number(item.score ?? 0), 0);
  const completedScore = items.reduce((total, item) => {
    const entry = entries[item.id] ?? {};
    return total + (isItemCompleted(item, entry) ? Number(item.score ?? 0) : 0);
  }, 0);

  return { completedScore, totalScore };
}

function calculateHistoryDayScore(day) {
  const entries = day?.entries ?? [];
  const totalScore = entries.reduce((total, entry) => (
    total + Number(entry.worshipItem?.score ?? entry.worshipItem?.xp ?? 0)
  ), 0);
  const completedScore = entries.reduce((total, entry) => total + Number(entry.scoreEarned ?? 0), 0);
  const scorePercentage = totalScore > 0 ? Math.round((completedScore / totalScore) * 100) : 0;

  return {
    completedScore,
    totalScore,
    scorePercentage,
  };
}

function buildTrackingPayload(items, entries, pageNotesByItemId = {}) {
  return items.map((item) => {
    const entry = entries[item.id] || {};
    const itemNote = typeof entry.notes === 'string' ? entry.notes.trim() : '';
    const pageNote = typeof pageNotesByItemId[item.id] === 'string' ? pageNotesByItemId[item.id].trim() : '';
    const payload = {
      worshipItemId: item.id,
      isCompleted: Boolean(entry.isCompleted),
    };

    if (entry.count !== undefined && entry.count !== null) {
      payload.count = Number(entry.count);
    }

    if (entry.duration !== undefined && entry.duration !== null) {
      payload.duration = Number(entry.duration);
    }

    if (itemNote || pageNote) {
      payload.notes = itemNote || pageNote;
    }

    return payload;
  });
}

function getDayCompletionStorageKey(trackingDay, currentDateKey) {
  const identifier = trackingDay?.id ?? currentDateKey;
  return identifier ? `thabat:tracking-day-complete:${identifier}` : null;
}

function hasSavedTrackingProgress(trackingDay) {
  const entries = trackingDay?.trackingEntries ?? [];

  return entries.some((entry) => (
    Boolean(entry.isCompleted)
    || Number(entry.scoreEarned ?? 0) > 0
    || Number(entry.count ?? 0) > 0
    || Number(entry.duration ?? 0) > 0
    || Boolean(entry.notes?.trim?.())
  ));
}

function TodayReadinessState({ reason }) {
  const { t } = useTranslation(['tracking']);

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border-2 border-foreground/80 bg-background/95 p-8 text-center shadow-[8px_8px_0_rgba(35,211,226,0.5)]">
      <h1 className="text-2xl font-bold">{t(`readiness.${reason}.title`)}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
        {t(`readiness.${reason}.description`)}
      </p>
    </div>
  );
}

function AddWorshipItemDialog({
  open,
  onOpenChange,
  availableItems,
  categoryName,
  customTitle,
  onCustomTitleChange,
  onCreateCustomItem,
  onAdd,
  pending,
}) {
  const { t } = useTranslation(['tracking']);
  const [search, setSearch] = useState('');
  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return availableItems;
    return availableItems.filter((item) => (
      item.title?.toLowerCase().includes(normalizedSearch)
      || item.category?.name?.toLowerCase().includes(normalizedSearch)
    ));
  }, [availableItems, search]);
  const groupedItems = useMemo(() => groupItemsByCategory(filteredItems), [filteredItems]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('customize.addTitle')}</DialogTitle>
          <DialogDescription>{t('customize.addDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-foreground/70 bg-primary/10 p-4">
            <label htmlFor="custom-worship-title" className="text-sm font-semibold text-slate-950 dark:text-white">
              {t('customize.customTitleLabel', { category: categoryName })}
            </label>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                id="custom-worship-title"
                value={customTitle}
                onChange={(event) => onCustomTitleChange(event.target.value)}
                placeholder={t('customize.customTitlePlaceholder')}
              />
              <Button
                type="button"
                onClick={onCreateCustomItem}
                disabled={pending || customTitle.trim().length < 2}
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
                {t('customize.createCustom')}
              </Button>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {t('customize.customTitleHint')}
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('customize.searchPlaceholder')}
              className="ps-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800"
                aria-label={t('customize.clearSearch')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="app-scrollbar max-h-[55vh] space-y-4 overflow-y-auto pe-1">
            {groupedItems.length === 0 && (
              <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                {t('customize.noAvailableItems')}
              </p>
            )}
            {groupedItems.map((group) => (
              <section key={group.id} className="space-y-2">
                <h3 className="text-sm font-bold text-primary">{group.name}</h3>
                <div className="grid gap-2">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onAdd(item.id)}
                      disabled={pending}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-start transition hover:border-primary/50 hover:bg-primary/5 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950"
                    >
                      <span>
                        <span className="block font-semibold text-slate-950 dark:text-white">{item.title}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {t('customize.points', { points: item.score ?? item.xp ?? 0 })}
                        </span>
                      </span>
                      <Plus className="h-4 w-4 text-primary" />
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {t('customize.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DailyTrackingPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(['tracking']);
  const [entries, setEntries] = useState({});
  const [newlyUnlocked, setNewlyUnlocked] = useState(null);
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState([]);
  const [newlyEarnedBadges, setNewlyEarnedBadges] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [completionFeedback, setCompletionFeedback] = useState(null);
  const [isDayCompleteView, setIsDayCompleteView] = useState(false);
  const [editorOverrideDateKey, setEditorOverrideDateKey] = useState(null);
  const [pageNotes, setPageNotes] = useState({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [customWorshipTitle, setCustomWorshipTitle] = useState('');

  const { data: todayState, isLoading } = useQuery({
    queryKey: ['trackingDay'],
    queryFn: () => TrackingService.getToday(),
  });
  const trackingDay = todayState?.trackingDay;
  const worshipItems = useMemo(() => todayState?.items ?? [], [todayState?.items]);
  const pages = useMemo(() => groupItemsIntoPages(worshipItems), [worshipItems]);
  const currentPage = pages[currentPageIndex];
  const isLastPage = currentPageIndex === pages.length - 1;
  const currentDateKey = trackingDay?.date?.slice(0, 10);
  const dayCompletionStorageKey = getDayCompletionStorageKey(trackingDay, currentDateKey);
  const hasServerSavedProgress = hasSavedTrackingProgress(trackingDay);
  const currentPageScore = useMemo(
    () => calculatePageScore(currentPage, entries),
    [currentPage, entries],
  );
  const isCurrentPageFullySelected = useMemo(() => (
    currentPage?.items?.length > 0
    && currentPage.items.every((item) => isItemCompleted(item, entries[item.id] ?? {}))
  ), [currentPage, entries]);
  const dayScore = useMemo(
    () => calculateDayScore(worshipItems, entries),
    [entries, worshipItems],
  );
  const { data: historyState } = useQuery({
    queryKey: ['trackingHistory', currentDateKey],
    queryFn: () => TrackingService.getHistory(),
    enabled: Boolean(todayState?.ready),
  });
  const { data: customSchedule } = useQuery({
    queryKey: ['trackingCustomSchedule'],
    queryFn: () => TrackingService.getCustomSchedule(),
    enabled: Boolean(todayState?.ready) && !isDayCompleteView,
  });
  const customItemIds = useMemo(() => customSchedule?.customItemIds ?? [], [customSchedule?.customItemIds]);
  const excludedItemIds = useMemo(() => customSchedule?.excludedItemIds ?? [], [customSchedule?.excludedItemIds]);
  const baseItemIdSet = useMemo(() => new Set(customSchedule?.baseItemIds ?? []), [customSchedule?.baseItemIds]);
  const finalItemIdSet = useMemo(() => new Set(worshipItems.map((item) => item.id)), [worshipItems]);
  const currentDayOfWeek = useMemo(() => {
    if (!currentDateKey) return new Date().getDay();
    return new Date(`${currentDateKey}T00:00:00Z`).getUTCDay();
  }, [currentDateKey]);
  const availableItemsToAdd = useMemo(() => (
    (customSchedule?.availableItems ?? []).filter((item) => {
      const sameCategory = item.category?.id === currentPage?.id;
      const availableToday = !item.daysOfWeek?.length || item.daysOfWeek.includes(currentDayOfWeek);
      return sameCategory && availableToday && !finalItemIdSet.has(item.id);
    })
  ), [currentDayOfWeek, currentPage?.id, customSchedule?.availableItems, finalItemIdSet]);
  const dayScorePercentage = dayScore.totalScore > 0
    ? Math.round((dayScore.completedScore / dayScore.totalScore) * 100)
    : 0;
  const lowProgressDaysCount = useMemo(() => {
    const historyLowDays = (historyState?.days ?? [])
      .filter((day) => day.date !== currentDateKey)
      .filter((day) => {
        const score = calculateHistoryDayScore(day);
        return score.totalScore > 0 && score.scorePercentage < 50;
      }).length;

    const currentLowDay = isDayCompleteView && dayScore.totalScore > 0 && dayScorePercentage < 50 ? 1 : 0;

    return historyLowDays + currentLowDay;
  }, [currentDateKey, dayScore.totalScore, dayScorePercentage, historyState?.days, isDayCompleteView]);
  const showLowProgressAlert = isDayCompleteView && lowProgressDaysCount > 3;
  const pageNotesByItemId = useMemo(() => {
    const notesByItemId = {};
    pages.forEach((page) => {
      const note = pageNotes[page.id];
      if (!note) return;
      page.items.forEach((item) => {
        notesByItemId[item.id] = note;
      });
    });
    return notesByItemId;
  }, [pageNotes, pages]);

  useEffect(() => {
    if (trackingDay?.trackingEntries) {
      const initial = {};
      trackingDay.trackingEntries.forEach(entry => {
        initial[entry.worshipItemId] = entry;
      });
      setEntries(initial);
    }
  }, [trackingDay]);

  useEffect(() => {
    if (!trackingDay?.trackingEntries || pages.length === 0) return;

    const nextPageNotes = {};
    pages.forEach((page) => {
      const noteEntry = page.items
        .map((item) => trackingDay.trackingEntries.find((entry) => entry.worshipItemId === item.id))
        .find((entry) => typeof entry?.notes === 'string' && entry.notes.trim());

      if (noteEntry?.notes) {
        nextPageNotes[page.id] = noteEntry.notes;
      }
    });

    setPageNotes(nextPageNotes);
  }, [pages, trackingDay]);

  useEffect(() => {
    if (editorOverrideDateKey === currentDateKey) {
      setIsDayCompleteView(false);
      return;
    }

    if (!dayCompletionStorageKey) {
      setIsDayCompleteView(false);
      return;
    }

    setIsDayCompleteView(
      localStorage.getItem(dayCompletionStorageKey) === 'true' || hasServerSavedProgress,
    );
  }, [currentDateKey, dayCompletionStorageKey, editorOverrideDateKey, hasServerSavedProgress]);

  useEffect(() => {
    setEditorOverrideDateKey(null);
  }, [currentDateKey]);

  useEffect(() => {
    if (currentPageIndex > 0 && currentPageIndex >= pages.length) {
      setCurrentPageIndex(Math.max(pages.length - 1, 0));
    }
  }, [currentPageIndex, pages.length]);

  const submitMutation = useMutation({
    mutationFn: (data) => TrackingService.submitToday(data),
    onSuccess: (res) => {
      toast.success(t('saved'));
      const unlockedAchievements = res.data?.newlyUnlockedAchievements ?? [];
      const earnedBadges = res.data?.newlyEarnedBadges ?? [];
      const finalDayScore = calculateDayScore(worshipItems, entries);
      const finalScorePercentage = finalDayScore.totalScore > 0
        ? Math.round((finalDayScore.completedScore / finalDayScore.totalScore) * 100)
        : 0;

      if (finalScorePercentage >= 90) {
        playHighScoreSound();
      } else if (finalScorePercentage >= 50) {
        playMidScoreSound();
      } else {
        playLowScoreSound();
      }

      queryClient.invalidateQueries(['trackingDay']);
      queryClient.invalidateQueries(['trackingHistory']);
      queryClient.invalidateQueries(['levelInfo']);
      queryClient.invalidateQueries(['streakInfo']);
      queryClient.invalidateQueries(['badges']);
      queryClient.invalidateQueries(['achievements']);
      if (dayCompletionStorageKey) {
        localStorage.setItem(dayCompletionStorageKey, 'true');
      }
      setEditorOverrideDateKey(null);
      setIsDayCompleteView(true);
      if (unlockedAchievements.length > 0) {
        setNewlyUnlockedAchievements(unlockedAchievements);
        setNewlyUnlocked(unlockedAchievements[0]);
      }
      if (earnedBadges.length > 0) {
        setNewlyEarnedBadges(earnedBadges);
      }
    },
    onError: () => {
      toast.error(t('saveFailed'));
    }
  });
  const scheduleMutation = useMutation({
    mutationFn: (data) => TrackingService.updateCustomSchedule(data),
    onSuccess: () => {
      toast.success(t('customize.saved'));
      queryClient.invalidateQueries({ queryKey: ['trackingCustomSchedule'] });
      queryClient.invalidateQueries({ queryKey: ['trackingDay'] });
      queryClient.invalidateQueries({ queryKey: ['trackingHistory'] });
      setAddDialogOpen(false);
    },
    onError: () => {
      toast.error(t('customize.saveFailed'));
    },
  });
  const createCustomItemMutation = useMutation({
    mutationFn: (data) => TrackingService.createCustomWorshipItem(data),
    onSuccess: () => {
      toast.success(t('customize.created'));
      setCustomWorshipTitle('');
      queryClient.invalidateQueries({ queryKey: ['trackingCustomSchedule'] });
      queryClient.invalidateQueries({ queryKey: ['trackingDay'] });
      queryClient.invalidateQueries({ queryKey: ['trackingHistory'] });
      setAddDialogOpen(false);
    },
    onError: () => {
      toast.error(t('customize.createFailed'));
    },
  });

  const handleEntryChange = (worshipItemId, value) => {
    setEntries(prev => ({
      ...prev,
      [worshipItemId]: {
        ...prev[worshipItemId],
        ...value,
      }
    }));
  };

  const handleToggleCurrentPageAll = useCallback(() => {
    if (!currentPage) return;

    setEntries((previous) => {
      const nextEntries = { ...previous };

      currentPage.items.forEach((item) => {
        nextEntries[item.id] = isCurrentPageFullySelected
          ? buildIncompleteEntryForItem(nextEntries[item.id])
          : buildCompletedEntryForItem(item, nextEntries[item.id]);
      });

      return nextEntries;
    });
  }, [currentPage, isCurrentPageFullySelected]);

  const handleSave = useCallback(() => {
    submitMutation.mutate({ entries: buildTrackingPayload(worshipItems, entries, pageNotesByItemId) });
  }, [entries, pageNotesByItemId, submitMutation, worshipItems]);

  const handleAddWorshipItem = useCallback((itemId) => {
    const nextExcludedItemIds = excludedItemIds.filter((id) => id !== itemId);
    const nextCustomItemIds = baseItemIdSet.has(itemId)
      ? customItemIds
      : [...new Set([...customItemIds, itemId])];

    scheduleMutation.mutate({
      customItemIds: nextCustomItemIds,
      excludedItemIds: nextExcludedItemIds,
    });
  }, [baseItemIdSet, customItemIds, excludedItemIds, scheduleMutation]);

  const handleRemoveWorshipItem = useCallback((itemId) => {
    const nextCustomItemIds = customItemIds.filter((id) => id !== itemId);
    const nextExcludedItemIds = baseItemIdSet.has(itemId)
      ? [...new Set([...excludedItemIds, itemId])]
      : excludedItemIds;

    setEntries((previous) => {
      const nextEntries = { ...previous };
      delete nextEntries[itemId];
      return nextEntries;
    });

    scheduleMutation.mutate({
      customItemIds: nextCustomItemIds,
      excludedItemIds: nextExcludedItemIds,
    });
  }, [baseItemIdSet, customItemIds, excludedItemIds, scheduleMutation]);

  const handleCreateCustomWorshipItem = useCallback(() => {
    if (!currentPage?.id || customWorshipTitle.trim().length < 2) return;

    createCustomItemMutation.mutate({
      title: customWorshipTitle.trim(),
      categoryId: currentPage.id,
    });
  }, [createCustomItemMutation, currentPage?.id, customWorshipTitle]);

  const handleEditToday = useCallback(() => {
    if (dayCompletionStorageKey) {
      localStorage.removeItem(dayCompletionStorageKey);
    }
    setEditorOverrideDateKey(currentDateKey);
    setIsDayCompleteView(false);
  }, [currentDateKey, dayCompletionStorageKey]);

  const completeCurrentPage = () => {
    if (!currentPage) return;
    if (isLastPage) {
      primeSoundEffects();
    } else {
      playStepSound();
    }
    setCompletionFeedback(calculatePageFeedback(currentPage, entries));
  };

  const goToPreviousPage = () => {
    setCompletionFeedback(null);
    setCurrentPageIndex((index) => Math.max(index - 1, 0));
  };

  const advanceAfterFeedback = useCallback(() => {
    setCompletionFeedback(null);

    if (isLastPage) {
      handleSave();
      return;
    }

    setCurrentPageIndex((index) => Math.min(index + 1, pages.length - 1));
  }, [isLastPage, pages.length, handleSave]);

  if (isLoading) return <TrackingSkeleton />;

  if (todayState && !todayState.ready) {
    return <TodayReadinessState reason={todayState.reason} />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary rtl:normal-case rtl:tracking-normal">
          {t('today')}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          {t('title')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>
      <WeeklyTrackingStrip
        history={historyState}
        currentDateKey={currentDateKey}
        currentScore={dayScore.completedScore}
        currentTotalScore={dayScore.totalScore}
        isDayComplete={isDayCompleteView}
        onEditToday={handleEditToday}
      />
      {isDayCompleteView && (
        <motion.div
          className="rounded-3xl border-2 border-foreground/80 bg-background/95 p-8 text-center shadow-[8px_8px_0_rgba(35,211,226,0.55)]"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary rtl:normal-case rtl:tracking-normal">
            {t('week.completedLabel')}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">
            {t('week.completedTitle')}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            {t('week.completedDescription')}
          </p>
          <div className="mx-auto mt-6 max-w-xs rounded-2xl border-2 border-foreground/80 bg-card p-5 shadow-[5px_5px_0_rgba(0,0,0,0.28)]">
            <p className="text-sm font-semibold text-primary">
              {t('week.dayScore')}
            </p>
            <p className="mt-2 text-4xl font-bold text-slate-950 dark:text-white">
              {dayScore.completedScore}/{dayScore.totalScore}
            </p>
          </div>
          {showLowProgressAlert && (
            <div className="mx-auto mt-5 flex max-w-xl items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-start text-amber-900 dark:text-amber-100">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
              <p className="text-sm leading-6">
                {t('lowProgress.message', { count: lowProgressDaysCount })}
              </p>
            </div>
          )}
        </motion.div>
      )}
      {isDayCompleteView && (
        <TodayRewardsPanel
          currentDateKey={currentDateKey}
          newlyEarnedBadges={newlyEarnedBadges}
          newlyUnlockedAchievements={newlyUnlockedAchievements}
          enabled={isDayCompleteView}
        />
      )}
      {!isDayCompleteView && currentPage && (
        <motion.div
          key={currentPage.name}
          className="overflow-hidden rounded-3xl border-2 border-foreground/80 bg-background/95 shadow-[8px_8px_0_rgba(35,211,226,0.55)]"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        >
          <div className="border-b bg-slate-50/80 p-5 dark:bg-slate-900/60">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary rtl:normal-case rtl:tracking-normal">
                  {t('flow.pageProgress', {
                    current: currentPageIndex + 1,
                    total: pages.length,
                  })}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                  {currentPage.name}
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setAddDialogOpen(true)}
                  disabled={scheduleMutation.isPending}
                >
                  <Plus className="h-4 w-4" />
                  {t('customize.addButton')}
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex gap-1.5" aria-label={t('flow.pageProgress', {
                  current: currentPageIndex + 1,
                  total: pages.length,
                })}>
                  {pages.map((page, index) => (
                    <button
                      type="button"
                      key={page.id ?? page.name}
                      onClick={() => setCurrentPageIndex(index)}
                      disabled={submitMutation.isPending}
                      className={`h-2.5 w-8 rounded-full transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 ${
                        index <= currentPageIndex
                          ? 'bg-primary'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                      aria-label={page.name}
                      aria-current={index === currentPageIndex ? 'step' : undefined}
                      title={page.name}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg border-2 border-foreground/70 bg-card px-3 py-2">
                    <div className="text-base font-bold text-slate-950 dark:text-white">
                      {currentPageScore.completedScore}/{currentPageScore.totalScore}
                    </div>
                    <div className="text-muted-foreground">{t('flow.score')}</div>
                  </div>
                  <div className="rounded-lg border-2 border-foreground/70 bg-card px-3 py-2">
                    <div className="text-base font-bold text-slate-950 dark:text-white">
                      {currentPageScore.scorePercentage}%
                    </div>
                    <div className="text-muted-foreground">{t('flow.progress')}</div>
                  </div>
                  <div className="rounded-lg border-2 border-foreground/70 bg-card px-3 py-2">
                    <div className="text-base font-bold text-slate-950 dark:text-white">
                      {currentPageScore.completedItems}/{currentPageScore.totalItems}
                    </div>
                    <div className="text-muted-foreground">{t('flow.items')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3 p-5">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleToggleCurrentPageAll}
                disabled={submitMutation.isPending || currentPage.items.length === 0}
              >
                {isCurrentPageFullySelected ? t('flow.deselectAll') : t('flow.selectAll')}
              </Button>
            </div>
            {currentPage.items.map((item) => (
              <div key={item.id} className="relative">
                <div className="absolute end-4 top-1/2 z-10 flex -translate-y-1/2 items-center gap-2">
                  <span className="rounded-full border-2 border-foreground/70 bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-[3px_3px_0_rgba(0,0,0,0.3)]">
                    {t('flow.pointsValue', { points: item.score ?? 0 })}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveWorshipItem(item.id)}
                    disabled={scheduleMutation.isPending}
                    className="rounded-full border border-destructive/30 bg-destructive/10 p-2 text-destructive transition hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive disabled:opacity-60"
                    aria-label={t('customize.removeItem', { item: item.title })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="pe-40">
                  <TrackingRenderer
                    item={item}
                    value={entries[item.id]}
                    onChange={(value) => handleEntryChange(item.id, value)}
                  />
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <label htmlFor={`page-note-${currentPage.id}`} className="text-sm font-semibold text-slate-950 dark:text-white">
                {t('flow.prayerNoteLabel', { prayer: currentPage.name })}
              </label>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {t('flow.prayerNoteHint')}
              </p>
              <textarea
                id={`page-note-${currentPage.id}`}
                value={pageNotes[currentPage.id] ?? ''}
                onChange={(event) => setPageNotes((previous) => ({
                  ...previous,
                  [currentPage.id]: event.target.value,
                }))}
                rows={3}
                maxLength={500}
                placeholder={t('flow.prayerNotePlaceholder')}
                className="mt-3 w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t bg-slate-50/80 p-5 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {t('flow.saveNote')}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousPage}
                disabled={submitMutation.isPending || currentPageIndex === 0}
                className="min-w-28"
              >
                {t('flow.previous')}
              </Button>
              <Button
                onClick={completeCurrentPage}
                disabled={submitMutation.isPending}
                className="min-w-36"
              >
                {submitMutation.isPending
                  ? t('saving')
                  : isLastPage
                    ? t('flow.finishDay')
                    : t('flow.next')}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
      <PageCompletionAnimation
        feedback={completionFeedback}
        onComplete={advanceAfterFeedback}
      />
      <AddWorshipItemDialog
        open={addDialogOpen}
        onOpenChange={(nextOpen) => {
          setAddDialogOpen(nextOpen);
          if (!nextOpen) setCustomWorshipTitle('');
        }}
        availableItems={availableItemsToAdd}
        categoryName={currentPage?.name}
        customTitle={customWorshipTitle}
        onCustomTitleChange={setCustomWorshipTitle}
        onCreateCustomItem={handleCreateCustomWorshipItem}
        onAdd={handleAddWorshipItem}
        pending={scheduleMutation.isPending || createCustomItemMutation.isPending}
      />
      <AchievementDetailDialog 
        achievement={newlyUnlocked} 
        onClose={() => setNewlyUnlocked(null)} 
      />
      <EarnedBadgesDialog
        badges={newlyEarnedBadges}
        onClose={() => setNewlyEarnedBadges([])}
      />
    </div>
  );
}
