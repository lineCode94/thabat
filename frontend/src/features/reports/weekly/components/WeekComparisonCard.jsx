import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

const COMPARISON_ITEMS = [
  { key: 'xpDelta', suffix: '' },
  { key: 'consistencyDelta', suffix: '%' },
  { key: 'completionDelta', suffix: '%' },
];

function DeltaIcon({ value }) {
  if (value > 0) return <ArrowUp className="h-4 w-4" />;
  if (value < 0) return <ArrowDown className="h-4 w-4" />;
  return <Minus className="h-4 w-4" />;
}

export function WeekComparisonCard({ comparison }) {
  const { t } = useTranslation(['reports']);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('weekly.comparison.title')}</CardTitle>
        <CardDescription>{t('weekly.comparison.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {COMPARISON_ITEMS.map((item) => {
          const value = comparison?.[item.key] ?? 0;

          return (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3"
            >
              <span className="text-sm text-muted-foreground">
                {t(`weekly.comparison.${item.key}`)}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-sm font-semibold',
                  value > 0 && 'text-success',
                  value < 0 && 'text-destructive',
                  value === 0 && 'text-muted-foreground',
                )}
              >
                <DeltaIcon value={value} />
                {value > 0 ? '+' : ''}
                {value}
                {item.suffix}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
