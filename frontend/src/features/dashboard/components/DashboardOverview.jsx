import { useTranslation } from 'react-i18next';

import { ProgressRing } from './ProgressRing';

export function DashboardOverview({ summary }) {
  const { t } = useTranslation(['dashboard']);

  if (!summary) return null;

  const remainingItems = summary.totalItems - summary.completedItems;

  return (
    <section className="flex flex-col items-center gap-8 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 md:flex-row">
      <div className="shrink-0">
        <ProgressRing radius={70} stroke={12} progress={summary.progressPercentage || 0} />
      </div>

      <div className="grid w-full flex-1 grid-cols-2 gap-4">
        <div className="rounded-2xl bg-green-50 p-4 text-center dark:bg-green-950/30">
          <div className="text-3xl font-bold text-success">{summary.completedItems}</div>
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('completedItems')}</div>
        </div>
        <div className="rounded-2xl bg-amber-50 p-4 text-center dark:bg-amber-950/30">
          <div className="text-3xl font-bold text-amber-500">{remainingItems}</div>
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('remainingItems')}</div>
        </div>
      </div>
    </section>
  );
}
