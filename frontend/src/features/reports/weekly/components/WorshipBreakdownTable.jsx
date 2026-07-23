import {
  ChevronDown,
  ListChecks,
  MessageSquareText,
  Minus,
  Search,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const UNCATEGORIZED_ORDER = 9999;

function normalizeSearch(value) {
  return value.trim().toLocaleLowerCase();
}

function getCategoryKey(item) {
  return item.category?.name || 'uncategorized';
}

function formatDateLabel(dateKey, language) {
  return new Intl.DateTimeFormat(language, {
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(`${dateKey}T00:00:00Z`));
}

function formatWeekday(dateKey, language) {
  return new Intl.DateTimeFormat(language, {
    weekday: 'short',
  }).format(new Date(`${dateKey}T00:00:00Z`));
}

function buildFallbackDays(items) {
  const dateKeys = new Set();
  items.forEach((item) => {
    item.days?.forEach((day) => dateKeys.add(day.date));
  });

  return Array.from(dateKeys)
    .sort()
    .map((date) => ({
      date,
      weekdayIndex: new Date(`${date}T00:00:00Z`).getUTCDay(),
    }));
}

function buildWeekDaysFromRange(week) {
  if (!week?.weekStartDate || !week?.weekEndDate) return [];

  const days = [];
  for (
    let current = new Date(`${week.weekStartDate}T00:00:00Z`);
    current <= new Date(`${week.weekEndDate}T00:00:00Z`);
    current.setUTCDate(current.getUTCDate() + 1)
  ) {
    const date = current.toISOString().slice(0, 10);
    days.push({
      date,
      weekdayIndex: current.getUTCDay(),
    });
  }

  return days;
}

function getItemDays(item, days) {
  const daysByDate = new Map((item.days ?? []).map((day) => [day.date, day]));

  return days.map((day) => daysByDate.get(day.date) ?? {
    date: day.date,
    isAssigned: false,
    isCompleted: false,
    scoreEarned: 0,
  });
}

function getNoteCount(item) {
  return (item.days ?? []).filter((day) => day.notes).length;
}

function getCategoryLabel(categoryName, t) {
  if (categoryName === 'Fajr') {
    return t('weekly.breakdown.categoryNames.fajr');
  }

  return categoryName || t('weekly.breakdown.uncategorized');
}

function buildCategoryGroups(items, days) {
  const groupsByKey = new Map();

  items.forEach((item) => {
    const key = getCategoryKey(item);
    const current = groupsByKey.get(key) ?? {
      key,
      name: item.category?.name,
      order: item.category?.order ?? UNCATEGORIZED_ORDER,
      items: [],
      completedDays: 0,
      totalDays: 0,
      scoreEarned: 0,
      possibleScore: 0,
      dayTotals: new Map(days.map((day) => [day.date, {
        date: day.date,
        completedItems: 0,
        totalItems: 0,
        scoreEarned: 0,
        possibleScore: 0,
      }])),
    };

    current.items.push(item);
    current.completedDays += item.completedDays ?? 0;
    current.totalDays += item.totalDays ?? 0;
    current.scoreEarned += item.scoreEarned ?? 0;
    current.possibleScore += item.possibleScore ?? 0;

    getItemDays(item, days).forEach((day) => {
      if (!day.isAssigned) return;
      const dayTotal = current.dayTotals.get(day.date);
      if (!dayTotal) return;
      dayTotal.totalItems += 1;
      dayTotal.possibleScore += item.score ?? 0;
      if (day.isCompleted) {
        dayTotal.completedItems += 1;
        dayTotal.scoreEarned += item.score ?? 0;
      }
    });

    groupsByKey.set(key, current);
  });

  return Array.from(groupsByKey.values())
    .map((group) => ({
      ...group,
      dayTotals: Array.from(group.dayTotals.values()),
      completionPercentage: group.totalDays > 0
        ? Math.round((group.completedDays / group.totalDays) * 100)
        : 0,
    }))
    .sort((first, second) => {
      if (first.order !== second.order) return first.order - second.order;
      return (first.name ?? '').localeCompare(second.name ?? '');
    });
}

function CompletionMark({ cell, label }) {
  if (!cell.isAssigned) {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-border/80 text-muted-foreground"
        aria-label={label.notAssigned}
        title={label.notAssigned}
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-2 text-xs font-bold shadow-sm',
        cell.isCompleted
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground',
      )}
      aria-label={cell.isCompleted ? label.completed : label.missed}
      title={cell.isCompleted ? label.completed : label.missed}
    >
      {cell.isCompleted ? cell.scoreEarned : 0}
    </span>
  );
}

export function WorshipBreakdownTable({
  items = [],
  dailyBreakdown = null,
  week = null,
}) {
  const { t, i18n } = useTranslation(['reports']);
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
  const normalizedSearch = normalizeSearch(search);
  const weekDays = buildWeekDaysFromRange(week);
  const days = dailyBreakdown?.days?.length
    ? dailyBreakdown.days
    : weekDays.length
      ? weekDays
      : buildFallbackDays(items);
  const weeklyItems = dailyBreakdown?.items?.length ? dailyBreakdown.items : items;

  const categoryGroups = useMemo(
    () => buildCategoryGroups(weeklyItems, days),
    [days, weeklyItems],
  );

  const visibleGroups = useMemo(() => {
    if (!normalizedSearch) return categoryGroups;

    return categoryGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => (
          item.title?.toLocaleLowerCase().includes(normalizedSearch)
          || getCategoryLabel(group.name, t).toLocaleLowerCase().includes(normalizedSearch)
        )),
      }))
      .filter((group) => group.items.length > 0);
  }, [categoryGroups, normalizedSearch, t]);

  useEffect(() => {
    if (categoryGroups.length === 0) {
      setExpandedGroups(new Set());
      return;
    }

    if (normalizedSearch) {
      setExpandedGroups(new Set(visibleGroups.map((group) => group.key)));
      return;
    }

    setExpandedGroups(new Set(categoryGroups.map((group) => group.key)));
  }, [categoryGroups, normalizedSearch, visibleGroups]);

  const toggleGroup = (groupKey) => {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('weekly.breakdown.title')}</CardTitle>
        <CardDescription>{t('weekly.breakdown.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {weeklyItems.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title={t('weekly.breakdown.emptyTitle')}
            description={t('weekly.breakdown.emptyDescription')}
          />
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="ps-9"
                placeholder={t('weekly.breakdown.searchPlaceholder')}
              />
            </div>

            {visibleGroups.length === 0 ? (
              <EmptyState
                icon={Search}
                title={t('weekly.breakdown.noMatchesTitle')}
                description={t('weekly.breakdown.noMatchesDescription')}
              />
            ) : (
              <div className="space-y-4">
                {visibleGroups.map((group, index) => {
                  const isExpanded = expandedGroups.has(group.key);
                  const sectionId = `weekly-breakdown-${index}`;

                  return (
                    <section
                      key={group.key}
                      className="overflow-hidden rounded-xl border border-border bg-muted/15"
                    >
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={sectionId}
                        onClick={() => toggleGroup(group.key)}
                        className="flex w-full items-center justify-between gap-3 bg-muted/20 px-4 py-3 text-start transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-card-foreground">
                            {getCategoryLabel(group.name, t)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t('weekly.breakdown.categorySummary', {
                              completed: group.completedDays,
                              total: group.totalDays,
                              percent: group.completionPercentage,
                            })}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-1 text-xs font-semibold',
                              group.completionPercentage < 50
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
                            )}
                          >
                            {group.completionPercentage}%
                          </span>
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 text-muted-foreground transition-transform',
                              isExpanded && 'rotate-180',
                            )}
                            aria-hidden="true"
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div id={sectionId} className="app-scrollbar overflow-x-auto border-t border-border bg-card">
                          <table className="min-w-[980px] w-full border-collapse text-sm">
                            <thead>
                              <tr className="border-b border-border bg-primary/10">
                                <th className="sticky start-0 z-10 min-w-64 bg-primary/10 px-3 py-3 text-start font-semibold text-card-foreground">
                                  {t('weekly.breakdown.item')}
                                </th>
                                {days.map((day) => (
                                  <th
                                    key={day.date}
                                    className="min-w-24 px-2 py-3 text-center font-semibold text-card-foreground"
                                  >
                                    <span className="block">{formatWeekday(day.date, i18n.language)}</span>
                                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                                      {formatDateLabel(day.date, i18n.language)}
                                    </span>
                                  </th>
                                ))}
                                <th className="min-w-24 px-3 py-3 text-center font-semibold text-card-foreground">
                                  {t('weekly.breakdown.score')}
                                </th>
                                <th className="min-w-28 px-3 py-3 text-center font-semibold text-card-foreground">
                                  {t('weekly.breakdown.notes')}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.items.map((item, itemIndex) => {
                                const itemDays = getItemDays(item, days);
                                const noteCount = getNoteCount(item);

                                return (
                                  <tr
                                    key={item.worshipItemId}
                                    className={cn(
                                      'border-b border-border/80',
                                      itemIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20',
                                    )}
                                  >
                                    <td className={cn(
                                      'sticky start-0 z-10 px-3 py-3 text-start font-medium text-card-foreground',
                                      itemIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20',
                                    )}
                                    >
                                      {item.title}
                                    </td>
                                    {itemDays.map((day) => (
                                      <td key={day.date} className="px-2 py-2 text-center">
                                        <CompletionMark
                                          cell={day}
                                          label={{
                                            completed: t('weekly.breakdown.completedDay'),
                                            missed: t('weekly.breakdown.missedDay'),
                                            notAssigned: t('weekly.breakdown.notAssignedDay'),
                                          }}
                                        />
                                      </td>
                                    ))}
                                    <td className="px-3 py-3 text-center font-semibold text-card-foreground">
                                      {t('weekly.breakdown.scoreValue', {
                                        earned: item.scoreEarned,
                                        total: item.possibleScore,
                                      })}
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                      {noteCount > 0 ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                                          <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />
                                          {noteCount}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="border-t border-border bg-destructive/15 font-semibold text-card-foreground">
                                <td className="sticky start-0 z-10 bg-destructive/15 px-3 py-3 text-start">
                                  {t('weekly.breakdown.categoryTotal')}
                                </td>
                                {group.dayTotals.map((day) => (
                                  <td key={day.date} className="px-2 py-3 text-center">
                                    {day.scoreEarned}
                                  </td>
                                ))}
                                <td className="px-3 py-3 text-center">
                                  {t('weekly.breakdown.scoreValue', {
                                    earned: group.scoreEarned,
                                    total: group.possibleScore,
                                  })}
                                </td>
                                <td className="px-3 py-3 text-center">
                                  {group.completionPercentage}%
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
