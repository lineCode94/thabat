import { CalendarDays, CheckCircle2, Lock, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

function formatDay(dateKey, language) {
  if (!dateKey) return '';

  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(new Date(`${dateKey}T00:00:00Z`));
}

function summarizeDay(day) {
  const entries = day?.entries ?? [];
  const score = entries.reduce((total, entry) => total + Number(entry.scoreEarned ?? 0), 0);
  const completedItems = entries.filter((entry) => entry.isCompleted).length;

  return {
    score,
    completedItems,
    totalItems: entries.length,
  };
}

export function WeeklyTrackingStrip({
  history,
  currentDateKey,
  currentScore,
  currentTotalScore,
  isDayComplete,
  onEditToday,
}) {
  const { t, i18n } = useTranslation(['tracking']);
  const days = history?.days ?? [];
  const activeDayLabel = formatDay(currentDateKey, i18n.language);

  const activeScoreLabel = currentTotalScore > 0
    ? `${currentScore}/${currentTotalScore}`
    : `${currentScore}`;

  const weekLabel = history?.week
    ? `${formatDay(history.week.weekStartDate, i18n.language)} - ${formatDay(
      history.week.weekEndDate,
      i18n.language,
    )}`
    : '';

  return (
    <section className="rounded-3xl border-2 border-foreground/80 bg-background/95 p-5 shadow-[8px_8px_0_rgba(35,211,226,0.55)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 border-foreground/80 bg-primary text-primary-foreground shadow-[4px_4px_0_rgba(0,0,0,0.35)]">
            <CalendarDays className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary rtl:normal-case rtl:tracking-normal">
              {isDayComplete ? t('week.todayCompleted') : t('week.todayOpen')}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
              {activeDayLabel}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('week.weekRange', { range: weekLabel })}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="rounded-2xl border-2 border-foreground/80 bg-card px-5 py-3 text-center shadow-[5px_5px_0_rgba(0,0,0,0.28)]">
            <p className="text-xs font-semibold text-primary">
              {t('week.dayScore')}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
              {activeScoreLabel}
            </p>
          </div>
          {isDayComplete && (
            <Button type="button" variant="outline" onClick={onEditToday} className="gap-2">
              <Pencil className="size-4" aria-hidden="true" />
              {t('week.editToday')}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((day) => {
          const isToday = day.date === currentDateKey;
          const summary = summarizeDay(day);

          return (
            <div
              key={day.date}
              className={`rounded-2xl border p-3 transition ${
                isToday
                  ? 'border-foreground bg-primary/15 text-slate-950 shadow-[5px_5px_0_rgba(35,211,226,0.45)] dark:text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold">
                    {formatDay(day.date, i18n.language).split(' ')[0]}
                  </p>
                  <p className="mt-1 text-xs">{day.date}</p>
                </div>
                {isToday ? (
                  <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                ) : (
                  <Lock className="size-4" aria-hidden="true" />
                )}
              </div>
              <div className="mt-3 text-xs">
                <p className="font-semibold">
                  {isToday ? t('week.open') : t('week.locked')}
                </p>
                <p className="mt-1">
                  {t('week.scoreShort', { score: isToday ? currentScore : summary.score })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
