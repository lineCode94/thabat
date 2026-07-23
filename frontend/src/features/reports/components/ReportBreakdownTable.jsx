import { ChevronDown, ListChecks, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const UNCATEGORIZED_ORDER = 9999;

function getCategoryName(item) {
  if (typeof item.category === 'string') return item.category;
  return item.category?.name;
}

function getCategoryOrder(item) {
  if (typeof item.category === 'object') return item.category?.order ?? UNCATEGORIZED_ORDER;
  return UNCATEGORIZED_ORDER;
}

function normalizeSearch(value) {
  return value.trim().toLocaleLowerCase();
}

function buildGroups(items, uncategorizedLabel) {
  const groups = new Map();

  items.forEach((item) => {
    const categoryName = getCategoryName(item) || uncategorizedLabel;
    const current = groups.get(categoryName) ?? {
      name: categoryName,
      order: getCategoryOrder(item),
      items: [],
      completed: 0,
      total: 0,
      scoreEarned: 0,
      possibleScore: 0,
    };

    const completed = item.completed ?? item.completedDays ?? 0;
    const total = item.total ?? item.totalDays ?? 0;

    current.items.push(item);
    current.completed += completed;
    current.total += total;
    current.scoreEarned += item.scoreEarned ?? 0;
    current.possibleScore += item.possibleScore ?? 0;
    groups.set(categoryName, current);
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      completionPercentage: group.total > 0 ? Math.round((group.completed / group.total) * 100) : 0,
    }))
    .sort((first, second) => {
      if (first.order !== second.order) return first.order - second.order;
      return first.name.localeCompare(second.name);
    });
}

export function ReportBreakdownTable({ items = [] }) {
  const { t } = useTranslation(['reports']);
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
  const normalizedSearch = normalizeSearch(search);

  const groups = useMemo(
    () => buildGroups(items, t('shared.breakdown.uncategorized')),
    [items, t],
  );

  const visibleGroups = useMemo(() => {
    if (!normalizedSearch) return groups;

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => (
          item.title?.toLocaleLowerCase().includes(normalizedSearch)
          || group.name.toLocaleLowerCase().includes(normalizedSearch)
        )),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, normalizedSearch]);

  useEffect(() => {
    setExpandedGroups(new Set(visibleGroups.map((group) => group.name)));
  }, [visibleGroups]);

  const toggleGroup = (groupName) => {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('shared.breakdown.title')}</CardTitle>
        <CardDescription>{t('shared.breakdown.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title={t('shared.breakdown.emptyTitle')}
            description={t('shared.breakdown.emptyDescription')}
          />
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="ps-9"
                placeholder={t('shared.breakdown.searchPlaceholder')}
              />
            </div>

            {visibleGroups.length === 0 ? (
              <EmptyState
                icon={Search}
                title={t('shared.breakdown.noMatchesTitle')}
                description={t('shared.breakdown.noMatchesDescription')}
              />
            ) : (
              <div className="space-y-3">
                {visibleGroups.map((group, index) => {
                  const isExpanded = expandedGroups.has(group.name);
                  const sectionId = `report-breakdown-${index}`;

                  return (
                    <section
                      key={group.name}
                      className="overflow-hidden rounded-xl border border-border bg-muted/15"
                    >
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={sectionId}
                        onClick={() => toggleGroup(group.name)}
                        className="flex w-full items-center justify-between gap-3 bg-muted/20 px-4 py-3 text-start transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-card-foreground">{group.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t('shared.breakdown.categorySummary', {
                              completed: group.completed,
                              total: group.total,
                              percent: group.completionPercentage,
                            })}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <Badge variant={group.completionPercentage >= 80 ? 'default' : 'secondary'}>
                            {group.completionPercentage}%
                          </Badge>
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
                        <div id={sectionId} className="border-t border-border bg-card">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t('shared.breakdown.item')}</TableHead>
                                <TableHead>{t('shared.breakdown.completed')}</TableHead>
                                <TableHead>{t('shared.breakdown.score')}</TableHead>
                                <TableHead className="text-end">{t('shared.breakdown.completion')}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.items.map((item) => {
                                const completed = item.completed ?? item.completedDays ?? 0;
                                const total = item.total ?? item.totalDays ?? 0;
                                const percent = item.completionPercentage ?? 0;

                                return (
                                  <TableRow key={item.worshipItemId}>
                                    <TableCell className="min-w-56 font-medium">
                                      <div>
                                        <p>{item.title}</p>
                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                                          <div
                                            className="h-full rounded-full bg-primary"
                                            style={{ width: `${Math.min(percent, 100)}%` }}
                                          />
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {t('shared.breakdown.completedValue', { completed, total })}
                                    </TableCell>
                                    <TableCell>
                                      {t('shared.breakdown.scoreValue', {
                                        earned: item.scoreEarned,
                                        total: item.possibleScore,
                                      })}
                                    </TableCell>
                                    <TableCell className="text-end font-semibold">
                                      {percent}%
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
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
