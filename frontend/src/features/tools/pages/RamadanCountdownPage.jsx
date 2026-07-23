import { CalendarClock, MoonStar } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '@/components/ui/card';

const RAMADAN_TARGETS = [
  '2027-02-08T00:00:00+02:00',
  '2028-01-28T00:00:00+02:00',
  '2029-01-16T00:00:00+02:00',
];

function getNextRamadanTarget(now = new Date()) {
  const target = RAMADAN_TARGETS.map((date) => new Date(date)).find((date) => date > now);
  return target || new Date(RAMADAN_TARGETS[RAMADAN_TARGETS.length - 1]);
}

function getParts(target, now) {
  const totalSeconds = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export function RamadanCountdownPage() {
  const { t, i18n } = useTranslation('tools');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const target = useMemo(() => getNextRamadanTarget(now), [now]);
  const parts = useMemo(() => getParts(target, now), [target, now]);

  const tiles = [
    ['days', parts.days],
    ['hours', parts.hours],
    ['minutes', parts.minutes],
    ['seconds', parts.seconds],
  ];

  return (
    <section className="mx-auto flex min-h-[calc(100vh-140px)] w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <Card className="relative w-full overflow-hidden border-2 border-foreground/80 bg-[radial-gradient(circle_at_20%_10%,rgba(178,245,140,0.22),transparent_34%),linear-gradient(135deg,rgba(9,18,35,0.98),rgba(11,40,52,0.96))] text-white shadow-[14px_14px_0_rgba(35,211,226,0.45)]">
        <div className="absolute -start-20 top-10 h-56 w-56 rounded-full bg-primary/25 blur-3xl" aria-hidden="true" />
        <div className="absolute -end-16 bottom-8 h-52 w-52 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
        <CardContent className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit rounded-3xl border-2 border-white/70 bg-white/10 p-4 shadow-[6px_6px_0_rgba(0,0,0,0.35)]">
              <MoonStar className="h-10 w-10 text-primary" aria-hidden="true" />
            </div>
            <p className="text-sm font-black text-primary">{t('title')}</p>
            <h1 className="mt-2 text-4xl font-black sm:text-5xl">{t('ramadan.title')}</h1>
            <p className="mt-4 max-w-xl text-lg text-white/72">{t('ramadan.subtitle')}</p>
            <div className="mt-8 rounded-3xl border-2 border-white/40 bg-white/10 p-5">
              <div className="flex items-center gap-3 text-sm font-bold text-white/70">
                <CalendarClock className="h-5 w-5 text-primary" aria-hidden="true" />
                {t('ramadan.expected')}
              </div>
              <p className="mt-2 text-2xl font-black">
                {target.toLocaleDateString(i18n.language, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="mt-2 text-sm text-white/60">{t('ramadan.note')}</p>
            </div>
          </div>

          <div className="grid content-center gap-4 sm:grid-cols-2">
            {tiles.map(([key, value]) => (
              <div key={key} className="rounded-3xl border-2 border-white/70 bg-white/95 p-6 text-center text-background shadow-[8px_8px_0_rgba(178,245,140,0.55)]">
                <p className="text-5xl font-black tabular-nums sm:text-6xl">{String(value).padStart(key === 'days' ? 1 : 2, '0')}</p>
                <p className="mt-2 text-sm font-black text-muted-foreground">{t(`ramadan.${key}`)}</p>
              </div>
            ))}
            <div className="rounded-3xl border-2 border-white/70 bg-accent p-6 text-center text-accent-foreground shadow-[8px_8px_0_rgba(0,0,0,0.45)] sm:col-span-2">
              <p className="text-xl font-black">{t('ramadan.message')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
