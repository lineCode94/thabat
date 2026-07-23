import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, CheckCircle2, Flag, Gift, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MissionService } from '@/features/missions/services/mission.service';

export function MissionSummaryWidget() {
  const { t } = useTranslation(['dashboard']);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['missions', 'summary'],
    queryFn: MissionService.summary,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-44 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (isError) return null;

  const pending = data?.pending ?? 0;

  return (
    <Card className="overflow-hidden border-violet-500/20 bg-gradient-to-br from-slate-950 to-violet-950 text-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-200 rtl:normal-case rtl:tracking-normal">
              {t('missions.eyebrow')}
            </p>
            <CardTitle className="mt-2 flex items-center gap-2 text-xl">
              <Flag className="h-5 w-5 text-violet-300" />
              {t('missions.title')}
            </CardTitle>
          </div>
          <Badge variant={pending > 0 ? 'default' : 'secondary'}>
            {t('missions.pendingBadge', { count: pending })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-2xl font-bold">{data?.completedThisWeek ?? 0}</p>
            <p className="mt-1 text-xs text-violet-100">{t('missions.weekly')}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-2xl font-bold">{data?.completedThisMonth ?? 0}</p>
            <p className="mt-1 text-xs text-violet-100">{t('missions.monthly')}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-2xl font-bold">{data?.missionXpThisMonth ?? 0}</p>
            <p className="mt-1 text-xs text-violet-100">{t('missions.xp')}</p>
          </div>
        </div>

        {pending === 0 ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100">
            <CheckCircle2 className="h-4 w-4" />
            {t('missions.allDone')}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/15 px-3 py-2 text-sm text-amber-100">
            <Gift className="h-4 w-4" />
            {t('missions.pendingHint', { count: pending })}
          </div>
        )}

        <Link
          to="/missions"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-violet-950 transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {t('missions.open')}
          <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
        </Link>
      </CardContent>
    </Card>
  );
}
