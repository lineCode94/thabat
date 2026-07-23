import { Activity, CheckCircle2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const SUMMARY_CARDS = [
  {
    key: 'xpEarned',
    icon: Sparkles,
    value: (totals) => totals?.xpEarned ?? 0,
    suffix: '',
  },
  {
    key: 'consistencyPercentage',
    icon: Activity,
    value: (totals) => totals?.consistencyPercentage ?? 0,
    suffix: '%',
  },
  {
    key: 'worshipCompletionPercentage',
    icon: CheckCircle2,
    value: (totals) => totals?.worshipCompletionPercentage ?? 0,
    suffix: '%',
  },
];

export function ReportSummaryCards({ totals }) {
  const { t } = useTranslation(['reports']);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {SUMMARY_CARDS.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t(`weekly.summary.${card.key}`)}
              </CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-card-foreground">
                {card.value(totals)}
                {card.suffix}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
