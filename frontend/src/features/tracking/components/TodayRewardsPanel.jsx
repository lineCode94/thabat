import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CalendarDays, Medal, Sparkles, Target, Trophy } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { AchievementService } from '@/features/gamification/services/achievement.service';
import { BadgeService } from '@/features/gamification/services/badge.service';
import { getBadgeDisplay, translateBadgeRarity } from '@/features/gamification/utils/badgeTranslations';

function getDateKey(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : null;
}

function mergeByKey(items, getKey) {
  return Array.from(new Map(items.filter(Boolean).map((item) => [getKey(item), item])).values());
}

function RewardCard({ title, subtitle, description, type, index }) {
  const Icon = type === 'badge' ? Medal : Trophy;
  const accent = type === 'badge'
    ? 'bg-amber-200 text-amber-950'
    : 'bg-cyan-200 text-slate-950';
  const strip = type === 'badge' ? 'bg-amber-300' : 'bg-cyan-300';

  return (
    <motion.div
      className="group relative overflow-hidden rounded-[1.75rem] border-2 border-slate-950 bg-card p-4 text-slate-950 shadow-[6px_6px_0_hsl(190_74%_38%_/_0.72)] [perspective:900px] dark:border-white dark:bg-slate-950 dark:text-white"
      initial={{ opacity: 0, y: 24, rotateX: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      whileHover={{ y: -4, scale: 1.015, rotateX: 3 }}
      transition={{ delay: index * 0.08, duration: 0.46, ease: 'easeOut' }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className={`absolute inset-x-0 top-0 h-2 ${strip}`} />
      <div className="flex items-start gap-4 pt-2">
        <span className={`reward-icon flex size-14 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-950 ${accent} dark:border-white`}>
          <Icon className="size-7" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-muted-foreground">
            {subtitle}
          </p>
          <h3 className="mt-1 truncate text-lg font-black">
            {title}
          </h3>
          {description && (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function RewardLinkCard({ icon: Icon, title, description, to }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border-2 border-slate-950 bg-cyan-50/80 p-4 transition hover:-translate-y-0.5 hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-white dark:bg-slate-950"
    >
      <div className="flex items-start gap-3">
        <span className="reward-icon flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 bg-lime-200 text-slate-950 dark:border-white">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-sm font-bold text-slate-950 dark:text-white">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
        </span>
      </div>
    </Link>
  );
}

export function TodayRewardsPanel({
  currentDateKey,
  newlyEarnedBadges = [],
  newlyUnlockedAchievements = [],
  enabled = false,
}) {
  const { t: tTracking } = useTranslation(['tracking']);
  const { t: tBadges } = useTranslation(['badges']);

  const { data: recentBadges = [] } = useQuery({
    queryKey: ['badges', 'recent', 'today-rewards'],
    queryFn: () => BadgeService.getRecent(12),
    enabled,
  });

  const { data: recentAchievements = [] } = useQuery({
    queryKey: ['achievements', 'recent', 'today-rewards'],
    queryFn: () => AchievementService.getRecent(12),
    enabled,
  });

  const todayBadges = useMemo(() => {
    const fromRecent = recentBadges.filter((badge) => getDateKey(badge.earnedAt) === currentDateKey);
    return mergeByKey([...newlyEarnedBadges, ...fromRecent], (badge) => badge.key);
  }, [currentDateKey, newlyEarnedBadges, recentBadges]);

  const todayAchievements = useMemo(() => {
    const fromRecent = recentAchievements.filter((achievement) => getDateKey(achievement.unlockedAt) === currentDateKey);
    return mergeByKey([...newlyUnlockedAchievements, ...fromRecent], (achievement) => achievement.key ?? achievement.name);
  }, [currentDateKey, newlyUnlockedAchievements, recentAchievements]);

  if (!enabled) return null;

  const hasRewards = todayBadges.length > 0 || todayAchievements.length > 0;

  return (
    <section className="rounded-3xl border-2 border-slate-950 bg-card p-6 dark:border-white">
      <div className="flex items-start gap-3">
        <span className="reward-icon flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-950 bg-cyan-200 text-slate-950 dark:border-white">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary rtl:normal-case rtl:tracking-normal">
            {tTracking('rewards.kicker')}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
            {tTracking('rewards.title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasRewards ? tTracking('rewards.description') : tTracking('rewards.empty')}
          </p>
        </div>
      </div>

      {hasRewards && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {todayBadges.map((badge, index) => {
            const display = getBadgeDisplay(badge, tBadges);

            return (
              <RewardCard
                key={`badge-${badge.key}`}
                type="badge"
                index={index}
                title={display.name}
                subtitle={`${tTracking('rewards.badge')} • ${translateBadgeRarity(badge.rarity, tBadges)}`}
                description={display.description}
              />
            );
          })}
          {todayAchievements.map((achievement, index) => (
            <RewardCard
              key={`achievement-${achievement.key ?? achievement.name}`}
              type="achievement"
              index={todayBadges.length + index}
              title={achievement.name}
              subtitle={tTracking('rewards.achievement')}
              description={achievement.description}
            />
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <RewardLinkCard
          icon={Target}
          to="/missions"
          title={tTracking('rewards.links.missions.title')}
          description={tTracking('rewards.links.missions.description')}
        />
        <RewardLinkCard
          icon={CalendarDays}
          to="/reports/weekly"
          title={tTracking('rewards.links.weekly.title')}
          description={tTracking('rewards.links.weekly.description')}
        />
        <RewardLinkCard
          icon={Trophy}
          to="/reports/monthly"
          title={tTracking('rewards.links.monthly.title')}
          description={tTracking('rewards.links.monthly.description')}
        />
      </div>
    </section>
  );
}
