import { ArrowLeft, Construction } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

const PLACEHOLDER_TITLE_KEYS = {
  daily: 'types.dailyPlaceholder.title',
  weekly: 'types.weeklyPlaceholder.title',
  monthly: 'types.monthlyPlaceholder.title',
  yearly: 'types.yearly.placeholderTitle',
};

export function ReportPlaceholderPage() {
  const { reportType } = useParams();
  const { t } = useTranslation(['reports']);
  const title = t(PLACEHOLDER_TITLE_KEYS[reportType] || 'title');

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Construction size={26} />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-slate-950 dark:text-white">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {t('placeholderDescription')}
      </p>
      <Link
        to="/reports"
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <ArrowLeft size={16} className="rtl:rotate-180" />
        {t('back')}
      </Link>
    </div>
  );
}
