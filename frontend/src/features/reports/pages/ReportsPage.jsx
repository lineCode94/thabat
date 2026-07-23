import { CalendarDays, CalendarRange, ChevronRight, LineChart, ScrollText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const REPORT_CARDS = [
  {
    type: 'daily',
    to: '/reports/daily',
    icon: CalendarDays,
    accent: 'text-violet-700 bg-violet-50 dark:bg-violet-950/30 dark:text-violet-300',
  },
  {
    type: 'weekly',
    to: '/reports/weekly',
    icon: CalendarRange,
    accent: 'text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300',
  },
  {
    type: 'monthly',
    to: '/reports/monthly',
    icon: LineChart,
    accent: 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300',
  },
  {
    type: 'yearly',
    to: '/reports/yearly',
    icon: ScrollText,
    accent: 'text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-300',
  },
];

export function ReportsPage() {
  const { t } = useTranslation(['reports']);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white/90 p-6 shadow-sm dark:border-violet-900/40 dark:bg-slate-900/90">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t('eyebrow')}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t('title')}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {t('description')}
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {REPORT_CARDS.map((report) => {
          const Icon = report.icon;

          return (
            <Link
              key={report.to}
              to={report.to}
              className="group rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-slate-800 dark:bg-slate-900/90"
            >
              <div className="flex items-start justify-between gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${report.accent}`}>
                  <Icon size={23} />
                </div>
                <ChevronRight
                  size={18}
                  className="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-primary rtl:rotate-180 rtl:group-hover:-translate-x-1"
                />
              </div>

              <div className="mt-5 space-y-2">
                <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                  {t(`types.${report.type}.title`)}
                </h2>
                <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {t(`types.${report.type}.description`)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
