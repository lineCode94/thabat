import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300',
  DRAFT: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300',
};

export function ReviewStatusBadge({ status }) {
  const { t } = useTranslation(['reviews']);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
        STATUS_STYLES[status] ?? STATUS_STYLES.PENDING,
      )}
    >
      {t(`status.${status ?? 'PENDING'}`)}
    </span>
  );
}
