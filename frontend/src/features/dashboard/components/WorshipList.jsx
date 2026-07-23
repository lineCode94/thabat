import { motion } from 'framer-motion';
import { ArrowUpRight, CheckCircle2, CircleDot, ListChecks, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemAnim = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function WorshipList({ trackingDay, readiness }) {
  const { t } = useTranslation(['common', 'dashboard']);

  if (readiness && !readiness.ready) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="overflow-hidden rounded-2xl border border-violet-100 bg-white/90 p-8 text-center shadow-sm dark:border-violet-900/40 dark:bg-slate-900/90"
      >
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-violet-100 to-orange-100 text-primary dark:from-violet-950/50 dark:to-orange-950/40">
          <Sparkles size={34} />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-slate-800 dark:text-slate-100">
          {t(`dashboard:readiness.${readiness.reason}.title`)}
        </h3>
        <p className="mx-auto max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t(`dashboard:readiness.${readiness.reason}.description`)}
        </p>
      </motion.div>
    );
  }

  if (!trackingDay || !trackingDay.trackingEntries || trackingDay.trackingEntries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="overflow-hidden rounded-2xl border border-violet-100 bg-white/90 p-8 text-center shadow-sm dark:border-violet-900/40 dark:bg-slate-900/90"
      >
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-violet-100 to-orange-100 text-primary dark:from-violet-950/50 dark:to-orange-950/40">
          <Sparkles size={34} />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-slate-800 dark:text-slate-100">
          {t('dashboard:emptyTitle')}
        </h3>
        <p className="mx-auto mb-5 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t('dashboard:emptyDescription')}
        </p>
        <Link
          to="/tracking"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={t('dashboard:emptyCta')}
        >
          {t('dashboard:emptyCta')}
        </Link>
      </motion.div>
    );
  }

  const completed = trackingDay.trackingEntries.filter((entry) => entry.isCompleted);
  const remaining = trackingDay.trackingEntries.filter((entry) => !entry.isCompleted);
  const remainingPreview = remaining.slice(0, 6);
  const completedPreview = completed.slice(0, 4);
  const hiddenRemainingCount = Math.max(remaining.length - remainingPreview.length, 0);
  const hiddenCompletedCount = Math.max(completed.length - completedPreview.length, 0);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-amber-400/20 bg-white/90 shadow-sm dark:border-amber-400/10 dark:bg-slate-900/90">
        <div className="flex flex-col gap-4 border-b border-slate-200/70 bg-gradient-to-br from-amber-50 to-violet-50 p-5 dark:border-slate-800 dark:from-amber-500/10 dark:to-violet-500/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500">
              <CircleDot size={20} aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                {t('dashboard:remainingToday')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('dashboard:remainingSummary', { count: remaining.length })}
              </p>
            </div>
          </div>
          <Link
            to="/tracking"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={t('dashboard:openTodayWorship')}
          >
            {t('dashboard:openTodayWorship')}
            <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        </div>

        <div className="p-5">
        {remaining.length === 0 ? (
          <div className="rounded-2xl border border-success/20 bg-success/5 p-4 text-sm font-medium text-success">
            {t('dashboard:allCaughtUp')}
          </div>
        ) : (
          <motion.ul variants={container} initial="hidden" animate="show" className="grid gap-2 sm:grid-cols-2">
            {remainingPreview.map((entry) => (
              <motion.li
                variants={itemAnim}
                key={entry.id}
                className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/80"
              >
                <span className="line-clamp-1 text-sm font-medium">
                  {entry.worshipItem?.title || t('common:states.unknownItem')}
                </span>
                <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-500">
                  {entry.worshipItem?.points ?? 0}
                </span>
              </motion.li>
            ))}
            {hiddenRemainingCount > 0 && (
              <motion.li
                variants={itemAnim}
                className="flex min-h-12 items-center justify-center rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary sm:col-span-2"
              >
                {t('dashboard:moreRemaining', { count: hiddenRemainingCount })}
              </motion.li>
            )}
          </motion.ul>
        )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <CheckCircle2 size={18} className="text-success" aria-hidden="true" />
            {t('dashboard:completed')}
          </h3>
          <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-sm font-semibold text-success">
            <ListChecks className="h-4 w-4" aria-hidden="true" />
            {completed.length}
          </div>
        </div>
        {completed.length === 0 ? (
          <p className="text-sm text-slate-500">{t('dashboard:noCompletedYet')}</p>
        ) : (
          <motion.ul variants={container} initial="hidden" animate="show" className="grid gap-2 sm:grid-cols-2">
            {completedPreview.map((entry) => (
              <motion.li
                variants={itemAnim}
                key={entry.id}
                className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-success/10 bg-success/5 px-3 py-2"
              >
                <span className="line-clamp-1 text-sm font-medium text-slate-700 line-through opacity-70 dark:text-slate-200">
                  {entry.worshipItem?.title || t('common:states.unknownItem')}
                </span>
                <span className="text-xs font-medium text-success">{t('common:actions.done')}</span>
              </motion.li>
            ))}
            {hiddenCompletedCount > 0 && (
              <motion.li
                variants={itemAnim}
                className="flex min-h-12 items-center justify-center rounded-xl border border-dashed border-success/30 bg-success/5 px-3 py-2 text-sm font-semibold text-success sm:col-span-2"
              >
                {t('dashboard:moreCompleted', { count: hiddenCompletedCount })}
              </motion.li>
            )}
          </motion.ul>
        )}
      </section>
    </div>
  );
}
