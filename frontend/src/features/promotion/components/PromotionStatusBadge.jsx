import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300',
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300',
  DECLINED: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300',
};

export function PromotionStatusBadge({ status }) {
  const { t } = useTranslation(['promotion']);

  return (
    <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold', STATUS_STYLES[status])}>
      {t(`status.${status}`)}
    </span>
  );
}
