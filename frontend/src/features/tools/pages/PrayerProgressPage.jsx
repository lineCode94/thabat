import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock3, Sunrise } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TrackingService } from '@/features/tracking/services/tracking.service';
import { cn } from '@/lib/utils';

const PRAYERS = [
  { key: 'fajr', time: '04:30', aliases: ['fajr', 'الفجر'] },
  { key: 'dhuhr', time: '12:05', aliases: ['dhuhr', 'ظهر', 'الظهر'] },
  { key: 'asr', time: '15:35', aliases: ['asr', 'عصر', 'العصر'] },
  { key: 'maghrib', time: '18:55', aliases: ['maghrib', 'مغرب', 'المغرب'] },
  { key: 'isha', time: '20:20', aliases: ['isha', 'عشاء', 'العشاء'] },
];

function timeToDate(time, baseDate = new Date()) {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatRemaining(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

function isItemCompleted(item, entry = {}) {
  const inputType = item.inputType?.toUpperCase();

  if (inputType === 'COUNT') {
    const count = Number(entry.count ?? 0);
    const targetValue = Number(item.targetValue ?? 0);
    return targetValue > 0 ? count >= targetValue : count > 0;
  }

  if (inputType === 'DURATION' || inputType === 'TIMER') {
    const duration = Number(entry.duration ?? 0);
    const targetValue = Number(item.targetValue ?? 0);
    return targetValue > 0 ? duration >= targetValue : duration > 0;
  }

  return Boolean(entry.isCompleted);
}

function buildPrayerCompletion(items = [], trackingEntries = []) {
  const entriesByItemId = new Map(trackingEntries.map((entry) => [entry.worshipItemId, entry]));

  return PRAYERS.reduce((result, prayer) => {
    const prayerItems = items.filter((item) => {
      const categoryName = String(item.category?.name ?? '').toLowerCase();
      return prayer.aliases.some((alias) => categoryName.includes(alias.toLowerCase()));
    });

    result[prayer.key] = {
      itemCount: prayerItems.length,
      isCompleted: prayerItems.length > 0 && prayerItems.every((item) => (
        isItemCompleted(item, entriesByItemId.get(item.id) ?? {})
      )),
    };

    return result;
  }, {});
}

export function PrayerProgressPage() {
  const { t, i18n } = useTranslation('tools');
  const [now, setNow] = useState(() => new Date());
  const { data: todayState } = useQuery({
    queryKey: ['trackingDay'],
    queryFn: () => TrackingService.getToday(),
  });

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const actualCompletion = useMemo(() => buildPrayerCompletion(
    todayState?.items ?? [],
    todayState?.trackingDay?.trackingEntries ?? [],
  ), [todayState?.items, todayState?.trackingDay?.trackingEntries]);

  const prayerState = useMemo(() => {
    const prayers = PRAYERS.map((prayer) => ({
      ...prayer,
      date: timeToDate(prayer.time, now),
      isCompleted: Boolean(actualCompletion[prayer.key]?.isCompleted),
      itemCount: actualCompletion[prayer.key]?.itemCount ?? 0,
    }));
    const nextIndex = prayers.findIndex((prayer) => prayer.date > now);
    const safeNextIndex = nextIndex === -1 ? 0 : nextIndex;
    const timeCompletedCount = nextIndex === -1 ? prayers.length : safeNextIndex;
    const nextPrayer = nextIndex === -1
      ? { ...prayers[0], date: new Date(timeToDate(prayers[0].time, now).getTime() + 24 * 60 * 60 * 1000) }
      : prayers[safeNextIndex];
    const previousPrayer = nextIndex === 0
      ? { ...prayers[prayers.length - 1], date: new Date(timeToDate(prayers[prayers.length - 1].time, now).getTime() - 24 * 60 * 60 * 1000) }
      : nextIndex === -1
        ? prayers[prayers.length - 1]
        : prayers[safeNextIndex - 1];
    const prayerWindowDuration = Math.max(1, nextPrayer.date - previousPrayer.date);
    const prayerWindowElapsed = Math.max(0, now - previousPrayer.date);
    const nextPrayerProgress = Math.min(100, Math.max(0, Math.round((prayerWindowElapsed / prayerWindowDuration) * 100)));
    const actualCompletedCount = prayers.filter((prayer) => prayer.isCompleted).length;

    return {
      prayers,
      nextPrayer,
      nextIndex: safeNextIndex,
      timeCompletedCount,
      completedCount: actualCompletedCount,
      progress: Math.round((actualCompletedCount / prayers.length) * 100),
      nextPrayerProgress,
    };
  }, [actualCompletion, now]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-2 text-center">
        <p className="text-sm font-bold text-primary">{t('title')}</p>
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">{t('prayers.title')}</h1>
        <p className="text-muted-foreground">{t('prayers.subtitle')}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card className="border-2 border-foreground/80 bg-background shadow-[10px_10px_0_rgba(178,245,140,0.55)]">
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-primary">{t('prayers.progress')}</p>
                <h2 className="text-2xl font-black">{prayerState.progress}%</h2>
              </div>
              <div className="rounded-2xl border-2 border-foreground/80 bg-card px-5 py-3 text-center shadow-[5px_5px_0_rgba(0,0,0,0.28)]">
                <p className="text-xs text-muted-foreground">{t('prayers.completed')}</p>
                <p className="text-xl font-black">{prayerState.completedCount}/{PRAYERS.length}</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {prayerState.prayers.map((prayer, index) => {
                const isMissed = index < prayerState.timeCompletedCount && !prayer.isCompleted;
                return (
                  <div
                    key={prayer.key}
                    className={cn(
                      'h-4 rounded-full border border-foreground/30 transition-colors',
                      prayer.isCompleted && 'bg-primary',
                      index === prayerState.nextIndex && !prayer.isCompleted && 'bg-primary',
                      isMissed && 'bg-destructive/70',
                      !prayer.isCompleted && index !== prayerState.nextIndex && !isMissed && 'bg-muted'
                    )}
                  />
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {prayerState.prayers.map((prayer, index) => {
              const isCompleted = prayer.isCompleted;
              const isNext = index === prayerState.nextIndex && !isCompleted;
              const isMissed = index < prayerState.timeCompletedCount && !isCompleted;
              return (
                <article
                  key={prayer.key}
                  className={cn(
                    'rounded-2xl border-2 border-foreground/80 bg-card p-4 shadow-[5px_5px_0_rgba(0,0,0,0.3)]',
                    isNext && 'border-primary bg-primary/10 text-foreground shadow-[5px_5px_0_rgba(35,211,226,0.45)]',
                    isMissed && 'border-destructive/70 bg-destructive/10 text-foreground shadow-[5px_5px_0_rgba(239,68,68,0.28)]',
                    isCompleted && 'bg-primary text-primary-foreground'
                  )}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-background/25 p-2">
                      {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
                    </span>
                    <span className={cn('text-xs font-bold opacity-75', isMissed && 'text-destructive opacity-100')}>
                      {isCompleted ? t('prayers.completed') : isMissed ? t('prayers.missed') : isNext ? t('prayers.upcoming') : t('prayers.later')}
                    </span>
                  </div>
                  <h3 className="text-xl font-black">{t(`prayers.names.${prayer.key}`)}</h3>
                  <p className="mt-1 text-sm opacity-80">{prayer.date.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}</p>
                </article>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-2 border-foreground/80 bg-[linear-gradient(145deg,hsl(var(--background)),hsl(var(--card))_48%,rgba(35,211,226,0.22))] text-foreground shadow-[10px_10px_0_rgba(35,211,226,0.55)]">
          <CardContent className="flex h-full flex-col justify-between gap-8 p-6">
            <div>
              <div className="mb-5 inline-flex rounded-2xl border-2 border-foreground/80 bg-primary p-3 text-primary-foreground shadow-[4px_4px_0_rgba(0,0,0,0.35)]">
                <Sunrise className="h-7 w-7" aria-hidden="true" />
              </div>
              <p className="text-sm font-bold text-primary">{t('prayers.nextPrayer')}</p>
              <h2 className="mt-2 text-4xl font-black">{t(`prayers.names.${prayerState.nextPrayer.key}`)}</h2>
              <p className="mt-2 text-lg font-bold text-muted-foreground">{prayerState.nextPrayer.date.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="rounded-3xl border-2 border-foreground/80 bg-card p-5 shadow-[5px_5px_0_rgba(0,0,0,0.28)]">
              <p className="text-sm font-bold text-primary">{t('prayers.timeRemaining')}</p>
              <p className="mt-2 text-4xl font-black tabular-nums">{formatRemaining(prayerState.nextPrayer.date - now)}</p>
              <div className="mt-5 h-4 overflow-hidden rounded-full border-2 border-foreground/70 bg-muted">
                <div
                  className="relative h-full overflow-hidden rounded-full bg-primary transition-all duration-700 after:absolute after:inset-y-0 after:w-16 after:animate-[pulse_1.4s_ease-in-out_infinite] after:bg-white/55 after:blur-sm ltr:after:-right-6 rtl:after:-left-6"
                  style={{ width: `${prayerState.nextPrayerProgress}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-bold text-muted-foreground">
                {prayerState.nextPrayerProgress}%
              </p>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{t('prayers.locationNote')}</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
