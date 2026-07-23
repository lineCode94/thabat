import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { GamificationService } from '../services/gamification.service';

export function LevelCard() {
  const { t } = useTranslation(['dashboard']);
  const { data: levelInfo, isLoading, isError } = useQuery({
    queryKey: ['levelInfo'],
    queryFn: () => GamificationService.getLevelInfo(),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">{t('level.journey')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !levelInfo) return null;

  return (
    <Card className="relative overflow-hidden border-2 border-foreground/80 bg-[linear-gradient(135deg,hsl(var(--card))_0%,hsl(var(--neo-cyan)/0.18)_48%,hsl(var(--neo-lime)/0.18)_100%)] text-foreground shadow-[8px_8px_0_hsl(var(--neo-shadow)/0.72)]">
      <div className="absolute -end-6 -top-6 text-primary/10">
        <Trophy size={120} />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-2 bg-[linear-gradient(90deg,hsl(var(--neo-cyan)),hsl(var(--neo-lime)))]" />

      <CardHeader className="relative z-10 pb-0">
        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-primary rtl:normal-case rtl:tracking-normal">
          <span className="flex size-8 items-center justify-center rounded-xl border border-foreground/70 bg-[hsl(var(--neo-yellow))] text-slate-950 shadow-[3px_3px_0_hsl(var(--neo-shadow)/0.6)]">
            <Star size={16} />
          </span>
          {t('level.currentLevel')}
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 pb-6 pt-4">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <span className="text-5xl font-black text-foreground">{levelInfo.currentLevel}</span>
            <span className="ms-2 text-sm font-bold text-muted-foreground">
              {t('level.totalXp', { xp: levelInfo.totalXp })}
            </span>
          </div>
          <div className="max-w-52 rounded-xl border border-foreground/20 bg-background/45 px-3 py-2 text-end text-sm font-bold text-foreground/85">
            {t('level.xpToLevel', {
              xp: levelInfo.remainingXp,
              level: levelInfo.currentLevel + 1,
            })}
          </div>
        </div>

        <div className="relative h-4 w-full overflow-hidden rounded-full border border-foreground/40 bg-background/70 shadow-inner">
          <motion.div
            className="relative h-full rounded-full bg-[linear-gradient(90deg,hsl(var(--neo-yellow)),hsl(var(--neo-lime)),hsl(var(--neo-cyan)))]"
            initial={{ width: 0 }}
            animate={{ width: `${levelInfo.progress}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <motion.div
                className="h-full w-1/2 skew-x-12 bg-white/45"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              />
            </div>
          </motion.div>
        </div>

        <div className="mt-2 flex justify-between px-1 text-xs font-black text-muted-foreground">
          <span>{levelInfo.currentLevelXp} XP</span>
          <span>{levelInfo.progress}%</span>
          <span>{levelInfo.nextLevelXp} XP</span>
        </div>
      </CardContent>
    </Card>
  );
}
