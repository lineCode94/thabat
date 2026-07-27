import { BookOpen, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';

export function AppLoader({ className, label = 'جاري تجهيز رحلتك...' }) {
  return (
    <div
      className={cn('flex min-h-[420px] items-center justify-center p-6', className)}
      role="status"
      aria-live="polite"
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-lg border-2 border-border bg-background/90 p-8 text-center shadow-[0_10px_0_rgba(6,182,212,0.28)]">
        <div className="absolute inset-x-8 top-0 h-px bg-primary/60" />
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-lg border-2 border-primary/45 bg-primary/15 text-primary">
          <BookOpen className="h-9 w-9 animate-pulse" />
        </div>

        <div className="mt-6 flex justify-center gap-2" aria-hidden="true">
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary" />
        </div>

        <p className="mt-5 text-lg font-black text-foreground">{label}</p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          بنحضّر لوحة الثبات والصلاحيات...
        </p>

        <Sparkles className="absolute start-5 top-5 h-5 w-5 text-primary/70" aria-hidden="true" />
      </div>
    </div>
  );
}
