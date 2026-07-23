import { Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Card, CardContent } from '@/components/ui/card';

function getAdviceKey(summary) {
  const progress = Number(summary?.progressPercentage ?? 0);
  const remaining = Math.max(Number(summary?.totalItems ?? 0) - Number(summary?.completedItems ?? 0), 0);

  if (progress >= 90) return 'excellent';
  if (progress >= 50) return 'steady';
  if (remaining > 0) return 'start';
  return 'empty';
}

export function DashboardAdviceCard({ summary }) {
  const { t } = useTranslation(['dashboard']);
  const adviceKey = getAdviceKey(summary);

  return (
    <Card className="border-amber-300/40 bg-gradient-to-br from-amber-50 to-violet-50 dark:border-amber-500/20 dark:from-amber-950/20 dark:to-violet-950/30">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200">
            <Lightbulb className="size-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-950 dark:text-white">{t(`advice.${adviceKey}.title`)}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{t(`advice.${adviceKey}.description`)}</p>
          </div>
        </div>
        <Link
          to="/tracking"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t('advice.openTracking')}
        </Link>
      </CardContent>
    </Card>
  );
}
