import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function StreakStatusCard({ streak }) {
  const { t } = useTranslation(['reports']);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{t('weekly.streak.title')}</CardTitle>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
          <Flame className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-3xl font-bold">
            {t('weekly.streak.currentValue', { count: streak?.currentStreak ?? 0 })}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('weekly.streak.longestValue', { count: streak?.longestStreak ?? 0 })}
          </p>
        </div>
        <Badge variant="secondary">
          {streak?.streakStatus ?? t('weekly.streak.noStatus')}
        </Badge>
      </CardContent>
    </Card>
  );
}
