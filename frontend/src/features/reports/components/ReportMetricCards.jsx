import { Activity, CheckCircle2, Sparkles, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const METRICS = [
  { key: 'xpEarned', icon: Sparkles, suffix: '' },
  { key: 'consistencyPercentage', icon: Activity, suffix: '%' },
  { key: 'worshipCompletionPercentage', icon: CheckCircle2, suffix: '%' },
  { key: 'completedScore', icon: Target, suffix: '' },
];

export function ReportMetricCards({ totals = {}, namespace = 'shared.metrics' }) {
  const { t } = useTranslation(['reports']);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {METRICS.map((metric) => {
        const Icon = metric.icon;
        const value = totals[metric.key] ?? 0;
        const label = metric.key === 'completedScore'
          ? t(`${namespace}.${metric.key}`, { total: totals.possibleScore ?? 0 })
          : t(`${namespace}.${metric.key}`);

        return (
          <Card key={metric.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-card-foreground">
                {value}
                {metric.suffix}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
