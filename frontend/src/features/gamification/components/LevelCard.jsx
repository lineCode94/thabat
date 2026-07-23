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
    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-violet-600 via-purple-600 to-slate-900 text-white shadow-lg">
      <div className="absolute -end-6 -top-6 opacity-10">
        <Trophy size={120} />
      </div>

      <CardHeader className="relative z-10 pb-0">
        <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-violet-100">
          <Star size={16} className="text-amber-300" />
          {t('level.currentLevel')}
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 pb-6 pt-4">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <span className="text-4xl font-bold">{levelInfo.currentLevel}</span>
            <span className="ms-2 text-sm font-medium text-violet-100">
              {t('level.totalXp', { xp: levelInfo.totalXp })}
            </span>
          </div>
          <div className="text-end text-sm font-medium text-violet-100">
            {t('level.xpToLevel', {
              xp: levelInfo.remainingXp,
              level: levelInfo.currentLevel + 1,
            })}
          </div>
        </div>

        <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-950/30 shadow-inner">
          <motion.div
            className="relative h-full rounded-full bg-gradient-to-r from-orange-200 to-rose-400"
            initial={{ width: 0 }}
            animate={{ width: `${levelInfo.progress}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <motion.div
                className="h-full w-1/2 skew-x-12 bg-white/30"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              />
            </div>
          </motion.div>
        </div>

        <div className="mt-2 flex justify-between px-1 text-xs font-medium text-violet-100">
          <span>{levelInfo.currentLevelXp} XP</span>
          <span>{levelInfo.progress}%</span>
          <span>{levelInfo.nextLevelXp} XP</span>
        </div>
      </CardContent>
    </Card>
  );
}
