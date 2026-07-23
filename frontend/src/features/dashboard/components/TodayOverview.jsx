import { CheckCircle2, CircleDot, Sparkles, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SUMMARY_ITEMS = [
  {
    key: 'completion',
    labelKey: 'todaysCompletion',
    icon: CheckCircle2,
    getValue: (summary) => `${summary.progressPercentage || 0}%`,
  },
  {
    key: 'xp',
    labelKey: 'todaysXp',
    icon: Sparkles,
    getValue: (summary) => summary.todayXp ?? 0,
  },
  {
    key: 'remaining',
    labelKey: 'remainingWorship',
    icon: CircleDot,
    getValue: (summary) => Math.max((summary.totalItems || 0) - (summary.completedItems || 0), 0),
  },
  {
    key: 'goal',
    labelKey: 'todaysGoal',
    icon: Target,
    getValue: (summary) => `${summary.completedItems || 0}/${summary.totalItems || 0}`,
  },
];

export function TodayOverview({ summary }) {
  const { t } = useTranslation(['dashboard']);

  if (!summary) return null;

  return (
    <section className="rounded-2xl border border-violet-100 bg-white/90 p-5 shadow-sm dark:border-violet-900/40 dark:bg-slate-900/90">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">{t('todaySummary')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('goalReady')}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SUMMARY_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.key}
              className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/70"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {t(item.labelKey)}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={18} />
                </span>
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                {item.getValue(summary)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
