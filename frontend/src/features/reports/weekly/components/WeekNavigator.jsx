import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import {
  addDays,
  fromDateKey,
  getMostRecentClosedWeekStartKey,
  getWeekEnd,
  toDateKey,
} from '../utils/week-date';

export function WeekNavigator({ onChange, value }) {
  const { i18n, t } = useTranslation(['reports']);
  const selectedStart = useMemo(() => fromDateKey(value), [value]);
  const latestClosedWeek = useMemo(() => fromDateKey(getMostRecentClosedWeekStartKey()), []);
  const canGoNext = selectedStart.getTime() < latestClosedWeek.getTime();

  const formatter = useMemo(() => new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }), [i18n.language]);

  const weekLabel = `${formatter.format(selectedStart)} - ${formatter.format(getWeekEnd(selectedStart))}`;

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary rtl:normal-case rtl:tracking-normal">
          {t('weekly.navigator.label')}
        </p>
        <p className="mt-1 text-lg font-semibold">{weekLabel}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(toDateKey(addDays(selectedStart, -7)))}
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          {t('weekly.navigator.previous')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canGoNext}
          onClick={() => onChange(toDateKey(addDays(selectedStart, 7)))}
        >
          {t('weekly.navigator.next')}
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
