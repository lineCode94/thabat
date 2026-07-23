import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { GamificationService } from '../services/gamification.service';

const STATUS_CONFIG = {
  ACTIVE: { accent: 'hsl(var(--neo-lime))', icon: 'hsl(var(--neo-yellow))' },
  AT_RISK: { accent: 'hsl(var(--neo-yellow))', icon: 'hsl(var(--neo-yellow))' },
  BROKEN: { accent: 'hsl(var(--muted-foreground))', icon: 'hsl(var(--muted-foreground))' },
  NEW: { accent: 'hsl(var(--neo-cyan))', icon: 'hsl(var(--neo-yellow))' },
};

export function StreakCard() {
  const { t } = useTranslation(['common', 'dashboard']);
  const { data: streak, isLoading } = useQuery({
    queryKey: ['streakInfo'],
    queryFn: () => GamificationService.getStreak(),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">
            {t('dashboard:streak.label')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>
    );
  }

  if (!streak) return null;

  const config = STATUS_CONFIG[streak.streakStatus] ?? STATUS_CONFIG.NEW;

  return (
    <Card className="relative overflow-hidden border-2 border-foreground/80 bg-[linear-gradient(135deg,hsl(var(--card))_0%,hsl(var(--neo-yellow)/0.20)_48%,hsl(var(--neo-cyan)/0.14)_100%)] text-foreground shadow-[8px_8px_0_hsl(var(--neo-shadow)/0.72)]">
      <div className="absolute -bottom-4 -end-4 opacity-10" style={{ color: config.icon }}>
        <Flame size={100} />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-2" style={{ background: config.accent }} />

      <CardHeader className="relative z-10 pb-0">
        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-primary rtl:normal-case rtl:tracking-normal">
          <span
            className="flex size-8 items-center justify-center rounded-xl border border-foreground/70 text-slate-950 shadow-[3px_3px_0_hsl(var(--neo-shadow)/0.6)]"
            style={{ background: config.accent }}
          >
            <Flame size={16} />
          </span>
          {t('dashboard:streak.title')}
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 pb-6 pt-4">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <AnimatePresence mode="wait">
              <motion.span
                key={streak.currentStreak}
                className="text-5xl font-black text-foreground"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {streak.currentStreak}
              </motion.span>
            </AnimatePresence>
            <span className="ms-2 text-sm font-bold text-muted-foreground">{t('common:units.days')}</span>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-foreground/20 bg-background/45 px-3 py-2 text-end text-sm font-bold text-foreground/85">
            <Trophy size={14} />
            {t('dashboard:streak.best', { days: streak.longestStreak })}
          </div>
        </div>

        <div className="text-xs font-black uppercase tracking-wide text-muted-foreground rtl:normal-case rtl:tracking-normal">
          {t(`dashboard:streak.statuses.${streak.streakStatus}`, {
            defaultValue: t('dashboard:streak.statuses.NEW'),
          })}
          {streak.lastCompletedDate && (
            <span className="ms-2 opacity-75">
              {t('dashboard:streak.lastTracked', { date: streak.lastCompletedDate })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
