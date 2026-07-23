import { RotateCcw, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { playTasbihSound } from '@/lib/soundEffects';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'thabat:tasbih';
const PRESETS = [33, 99, 100];

function loadTasbihState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      count: Number.isFinite(stored.count) ? stored.count : 0,
      target: Number.isFinite(stored.target) ? stored.target : 33,
      session: Number.isFinite(stored.session) ? stored.session : 0,
    };
  } catch {
    return { count: 0, target: 33, session: 0 };
  }
}

export function TasbihPage() {
  const { t } = useTranslation('tools');
  const [state, setState] = useState(loadTasbihState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code !== 'Space') return;
      if (event.target?.matches?.('input, textarea, button, select')) return;
      event.preventDefault();
      playTasbihSound();
      setState((current) => ({
        ...current,
        count: current.count + 1,
        session: current.session + 1,
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const progress = useMemo(() => {
    if (!state.target) return 0;
    return Math.min(100, Math.round((state.count / state.target) * 100));
  }, [state.count, state.target]);

  const increment = () => {
    playTasbihSound();
    setState((current) => ({
      ...current,
      count: current.count + 1,
      session: current.session + 1,
    }));
  };

  const reset = () => {
    setState((current) => ({ ...current, count: 0 }));
  };

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-2 text-center">
        <p className="text-sm font-bold text-primary">{t('title')}</p>
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">{t('tasbih.title')}</h1>
        <p className="text-muted-foreground">{t('tasbih.subtitle')}</p>
      </div>

      <Card className="overflow-hidden border-2 border-foreground/80 bg-background shadow-[10px_10px_0_rgba(35,211,226,0.55)]">
        <CardContent className="grid gap-8 p-6 lg:grid-cols-[1fr_280px]">
          <button
            type="button"
            onClick={increment}
            className="group relative mx-auto flex aspect-square w-full max-w-[440px] flex-col items-center justify-center rounded-full border-2 border-foreground bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.95),rgba(178,245,140,0.82)_30%,rgba(35,211,226,0.9)_62%,rgba(9,18,35,1)_100%)] text-foreground shadow-[16px_16px_0_rgba(0,0,0,0.55)] transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 active:translate-y-1"
            aria-label={t('tasbih.tap')}
          >
            <span className="absolute inset-5 rounded-full border border-white/50 opacity-60" aria-hidden="true" />
            <Sparkles className="mb-4 h-12 w-12 text-background drop-shadow" aria-hidden="true" />
            <span className="text-7xl font-black text-background drop-shadow-lg sm:text-8xl">{state.count}</span>
            <span className="mt-3 rounded-full border border-background/40 bg-background/20 px-4 py-1 text-sm font-bold text-background">
              {t('tasbih.tap')}
            </span>
          </button>

          <div className="flex flex-col justify-center gap-4">
            <div className="rounded-2xl border-2 border-foreground/80 bg-card p-5 shadow-[6px_6px_0_rgba(0,0,0,0.35)]">
              <p className="text-sm text-muted-foreground">{t('tasbih.count')}</p>
              <p className="mt-1 text-4xl font-black text-foreground">{state.count}</p>
            </div>
            <div className="rounded-2xl border-2 border-foreground/80 bg-card p-5 shadow-[6px_6px_0_rgba(0,0,0,0.35)]">
              <p className="text-sm text-muted-foreground">{t('tasbih.session')}</p>
              <p className="mt-1 text-3xl font-black text-foreground">{state.session}</p>
            </div>
            <div className="space-y-3 rounded-2xl border-2 border-foreground/80 bg-card p-5 shadow-[6px_6px_0_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold">{t('tasbih.target')}</span>
                <span className={cn('rounded-full px-3 py-1 text-xs font-black', progress >= 100 ? 'bg-success text-success-foreground' : 'bg-secondary text-secondary-foreground')}>
                  {progress >= 100 ? t('tasbih.completed') : `${progress}%`}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full border border-foreground/30 bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <Input
                type="number"
                min="1"
                value={state.target}
                onChange={(event) => setState((current) => ({ ...current, target: Math.max(1, Number(event.target.value) || 1) }))}
                aria-label={t('tasbih.customTarget')}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={state.target === preset ? 'default' : 'outline'}
                  onClick={() => setState((current) => ({ ...current, target: preset }))}
                >
                  {preset}
                </Button>
              ))}
              <Button type="button" variant="outline" onClick={reset}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {t('tasbih.reset')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
