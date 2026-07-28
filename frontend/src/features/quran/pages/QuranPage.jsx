import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, CalendarCheck, CheckCircle2, Clock3, Edit3, Lock, Medal, RotateCcw, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { QuranService } from '../services/quran.service';

const QURAN_TOTAL_PAGES = 604;
const QURAN_TOTAL_JUZ = 30;
const WEEKS_PER_MONTH = 4;
const QURAN_BADGE_KEYS = [
  'quran_weekly_consistency',
  'quran_memorized_10_juz',
  'quran_memorized_15_juz',
  'quran_memorized_20_juz',
  'quran_memorized_30_juz',
];

const TRACKS = {
  MEMORIZING: {
    title: 'لسه بيحفظ',
    description: 'اكتب حافظ كام جزء، وبيحفظ كام صفحة أسبوعيا عشان نحسب المتبقي للختم.',
    icon: BookOpen,
  },
  REVIEWING: {
    title: 'حافظ',
    description: 'تابع دورة مراجعة كاملة للقرآن وعدل ورد المراجعة الأسبوعي.',
    icon: RotateCcw,
  },
};

function formatNumber(value) {
  const number = Number(value ?? 0);
  return Number.isInteger(number) ? String(number) : number.toFixed(1).replace(/\.0$/, '');
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(new Date(value));
}

function juzToPages(juz) {
  return (Number(juz || 0) / QURAN_TOTAL_JUZ) * QURAN_TOTAL_PAGES;
}

function estimateMonths(remainingPages, weeklyTargetPages) {
  if (!weeklyTargetPages || remainingPages <= 0) return null;
  return Math.ceil(remainingPages / weeklyTargetPages / WEEKS_PER_MONTH);
}

function isCurrentWeekLog(log) {
  if (!log?.weekStartDate || !log?.weekEndDate) return false;
  const now = new Date();
  return new Date(log.weekStartDate) <= now && now <= new Date(log.weekEndDate);
}

function getMonthLoggedPages(logs = []) {
  const now = new Date();
  return logs
    .filter((log) => {
      const date = new Date(log.weekStartDate);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    })
    .reduce((total, log) => total + Number(log.amountPages ?? 0), 0);
}

function getTrackCopy(trackType) {
  const isReviewing = trackType === 'REVIEWING';
  return {
    action: isReviewing ? 'راجعت' : 'حفظت',
    setupProgressLabel: isReviewing ? 'راجعت كام صفحة في دورة المراجعة الحالية؟' : 'حافظ كام جزء حاليا؟',
    setupProgressPlaceholder: isReviewing ? 'مثال: 120' : 'مثال: 4',
    setupProgressMax: isReviewing ? QURAN_TOTAL_PAGES : QURAN_TOTAL_JUZ,
    setupProgressStep: isReviewing ? '1' : '0.25',
    weeklyTarget: isReviewing ? 'ورد المراجعة الأسبوعي بالصفحات' : 'معدل الحفظ الأسبوعي بالصفحات',
    remainingTitle: isReviewing ? 'المتبقي لختم المراجعة' : 'المتبقي للختم',
    completionWord: isReviewing ? 'تختم مراجعة القرآن' : 'تختم حفظ القرآن',
    dialogTitle: isReviewing ? 'تعديل ورد المراجعة' : 'تعديل معدل الحفظ',
    dialogDescription: isReviewing
      ? 'غير عدد الصفحات اللي ناوي تراجعها أسبوعيا، والحسابات هتتحدث حسب الورد الجديد.'
      : 'غير عدد الصفحات اللي ناوي تحفظها أسبوعيا، والحسابات هتتحدث حسب المعدل الجديد.',
  };
}

function QuranSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Skeleton className="h-28 rounded-lg" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-36 rounded-lg" />
      </div>
      <Skeleton className="h-44 rounded-lg" />
    </div>
  );
}

function SetupPanel({ onSetup, isPending }) {
  const [trackType, setTrackType] = useState('MEMORIZING');
  const [progressInput, setProgressInput] = useState('');
  const [weeklyTargetInput, setWeeklyTargetInput] = useState('');
  const copy = getTrackCopy(trackType);
  const progressValue = Number(progressInput || 0);
  const progressPages = trackType === 'MEMORIZING' ? juzToPages(progressValue) : progressValue;
  const weeklyTargetPages = Number(weeklyTargetInput || 0);
  const remainingPages = Math.max(0, QURAN_TOTAL_PAGES - progressPages);
  const monthTargetPages = weeklyTargetPages > 0 ? Math.min(remainingPages, Math.round(weeklyTargetPages * WEEKS_PER_MONTH)) : 0;
  const months = estimateMonths(remainingPages, weeklyTargetPages);

  function handleSubmit(event) {
    event.preventDefault();
    onSetup({
      trackType,
      memorizedJuz: trackType === 'MEMORIZING' ? progressValue : undefined,
      cumulativePagesMemorized: trackType === 'REVIEWING' ? progressPages : undefined,
      weeklyTargetPages,
    });
  }

  return (
    <form className="grid gap-5 lg:grid-cols-[1fr_360px]" onSubmit={handleSubmit}>
      <section className="grid gap-4 md:grid-cols-2">
        {Object.entries(TRACKS).map(([key, track]) => {
          const Icon = track.icon;
          const selected = trackType === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTrackType(key);
                setProgressInput('');
              }}
              className={cn(
                'min-h-56 rounded-lg border-2 bg-background/85 p-6 text-right transition',
                selected ? 'border-primary shadow-[0_8px_0_rgba(6,182,212,0.34)]' : 'border-border hover:border-primary/60',
              )}
            >
              <div className="mb-10 flex items-center justify-between">
                <span className={cn('rounded-md px-3 py-1 text-xs font-black', selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                  {selected ? 'المسار المختار' : 'اختيار'}
                </span>
                <Icon className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-black text-foreground">{track.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{track.description}</p>
            </button>
          );
        })}
      </section>

      <section className="rounded-lg border-2 border-border bg-background/90 p-5 text-right shadow-[0_6px_0_rgba(6,182,212,0.2)]">
        <h2 className="text-xl font-black text-foreground">بيانات البداية</h2>
        <div className="mt-5 space-y-4">
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">{copy.setupProgressLabel}</span>
            <Input
              className="h-12 border-2 bg-background text-lg font-bold"
              min="0"
              max={copy.setupProgressMax}
              step={copy.setupProgressStep}
              type="number"
              value={progressInput}
              onChange={(event) => setProgressInput(event.target.value)}
              placeholder={copy.setupProgressPlaceholder}
            />
          </label>

          {trackType === 'MEMORIZING' && progressValue > 0 && (
            <p className="text-xs font-bold text-muted-foreground">
              يعني تقريبا {formatNumber(progressPages)} صفحة محفوظة من أصل {QURAN_TOTAL_PAGES} صفحة.
            </p>
          )}

          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">{copy.weeklyTarget}</span>
            <Input
              className="h-12 border-2 bg-background text-lg font-bold"
              min="1"
              max={QURAN_TOTAL_PAGES}
              step="1"
              type="number"
              value={weeklyTargetInput}
              onChange={(event) => setWeeklyTargetInput(event.target.value)}
              placeholder="مثال: 10"
            />
          </label>

          {weeklyTargetPages > 0 && (
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm leading-7 text-muted-foreground">
              متوقع هذا الشهر {formatNumber(monthTargetPages)} صفحة، و{copy.completionWord} بعد حوالي {formatNumber(months ?? 0)} شهر.
            </div>
          )}

          <Button className="h-12 w-full text-base font-black" disabled={isPending || weeklyTargetPages <= 0} type="submit">
            <Save />
            حفظ البداية
          </Button>
        </div>
      </section>
    </form>
  );
}

function SummaryCards({ progress, logs }) {
  const currentWeekLog = logs.find(isCurrentWeekLog);
  const weeklyTargetPages = Number(progress.weeklyTargetPages ?? 0);
  const monthLoggedPages = getMonthLoggedPages(logs);
  const monthTargetPages = weeklyTargetPages > 0 ? Math.round(weeklyTargetPages * WEEKS_PER_MONTH) : 0;
  const remainingThisMonth = Math.max(0, monthTargetPages - monthLoggedPages);
  const remainingAll = Number(progress.remainingPages ?? 0);
  const months = progress.estimatedMonthsToCompletion ?? estimateMonths(remainingAll, weeklyTargetPages);
  const copy = getTrackCopy(progress.trackType);

  const cards = [
    {
      title: `${copy.action} الأسبوع ده`,
      value: `${formatNumber(currentWeekLog?.amountPages ?? 0)} صفحة`,
      hint: currentWeekLog ? `تم التسجيل يوم ${formatDate(currentWeekLog.createdAt)}` : 'لسه مفيش تسجيل للأسبوع الحالي',
      icon: CalendarCheck,
      active: Boolean(currentWeekLog),
    },
    {
      title: 'متبقي للشهر ده',
      value: `${formatNumber(remainingThisMonth)} صفحة`,
      hint: `هدف الشهر: ${formatNumber(monthTargetPages)} صفحة حسب ورد ${formatNumber(weeklyTargetPages)} أسبوعيا`,
      icon: Clock3,
      active: true,
    },
    {
      title: copy.remainingTitle,
      value: `${formatNumber(remainingAll)} صفحة`,
      hint: remainingAll > 0 && months ? `لو كملت بنفس المعدل: حوالي ${formatNumber(months)} شهر` : 'تم الوصول للهدف الحالي',
      icon: BookOpen,
      active: true,
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.title}
            className={cn(
              'rounded-lg border-2 bg-background/90 p-5 text-right shadow-[0_6px_0_rgba(6,182,212,0.24)]',
              card.active ? 'border-primary/45' : 'border-border',
            )}
          >
            <div className="mb-8 flex justify-end">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Icon className="h-6 w-6" />
              </span>
            </div>
            <p className="text-sm font-black text-muted-foreground">{card.title}</p>
            <p className="mt-2 text-3xl font-black text-foreground">{card.value}</p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{card.hint}</p>
          </article>
        );
      })}
    </section>
  );
}

function TargetDialog({ progress, onUpdate, isPending }) {
  const [open, setOpen] = useState(false);
  const [weeklyTargetPages, setWeeklyTargetPages] = useState(progress.weeklyTargetPages ?? '');
  const weeklyPages = Number(weeklyTargetPages || 0);
  const remainingPages = Math.max(0, Number(progress.remainingPages ?? 0));
  const months = estimateMonths(remainingPages, weeklyPages);
  const monthTargetPages = weeklyPages > 0 ? Math.round(weeklyPages * WEEKS_PER_MONTH) : 0;
  const copy = getTrackCopy(progress.trackType);

  function handleSubmit(event) {
    event.preventDefault();
    onUpdate(
      { weeklyTargetPages: weeklyPages },
      { onSuccess: () => setOpen(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 px-5 text-sm font-black" variant="outline">
          <Edit3 />
          تحديث المعدل
        </Button>
      </DialogTrigger>
      <DialogContent className="border-2 text-right shadow-[0_10px_0_rgba(6,182,212,0.28)]">
        <DialogHeader className="text-right">
          <DialogTitle className="text-2xl font-black">{copy.dialogTitle}</DialogTitle>
          <DialogDescription className="leading-7">{copy.dialogDescription}</DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-black text-muted-foreground">{copy.weeklyTarget}</span>
            <Input
              className="h-12 border-2 bg-background text-lg font-bold"
              min="1"
              max={QURAN_TOTAL_PAGES}
              step="1"
              type="number"
              value={weeklyTargetPages}
              onChange={(event) => setWeeklyTargetPages(event.target.value)}
              placeholder="مثال: 10"
            />
          </label>

          {weeklyPages > 0 && (
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm leading-7 text-muted-foreground">
              بالمعدل ده هتنجز تقريبا {formatNumber(monthTargetPages)} صفحة في الشهر، والهدف يخلص بعد حوالي {formatNumber(months ?? 0)} شهر.
            </div>
          )}

          <DialogFooter>
            <Button className="h-11 px-6 font-black" disabled={isPending || weeklyPages <= 0} type="submit">
              <Save />
              حفظ المعدل
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WeeklyLogPanel({ progress, logs, onSubmit, isPending }) {
  const [amountPages, setAmountPages] = useState('');
  const currentWeekLog = logs.find(isCurrentWeekLog);
  const copy = getTrackCopy(progress.trackType);
  const remainingAfterThisWeek = Math.max(0, Number(progress.remainingPages ?? 0) - Number(amountPages || 0));

  if (currentWeekLog) {
    return (
      <section className="rounded-lg border-2 border-emerald-500/40 bg-emerald-500/10 p-5 text-right">
        <div className="flex items-start justify-between gap-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          <div>
            <h2 className="text-2xl font-black text-foreground">تم تسجيل الأسبوع الحالي</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {copy.action} هذا الأسبوع {formatNumber(currentWeekLog.amountPages)} صفحة.
            </p>
          </div>
        </div>
      </section>
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ amountPages: Number(amountPages) });
    setAmountPages('');
  }

  return (
    <form className="rounded-lg border-2 border-border bg-background/80 p-5 text-right" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <label className="flex-1 space-y-2">
          <span className="text-sm font-black text-muted-foreground">كم صفحة {copy.action} هذا الأسبوع؟</span>
          <Input
            className="h-12 border-2 bg-background text-lg font-bold"
            min="1"
            max={QURAN_TOTAL_PAGES}
            step="1"
            type="number"
            value={amountPages}
            onChange={(event) => setAmountPages(event.target.value)}
            placeholder="مثال: 3"
          />
        </label>
        <Button className="h-12 px-6 text-base font-black" disabled={isPending || Number(amountPages || 0) <= 0} type="submit">
          <CheckCircle2 />
          تسجيل الأسبوع
        </Button>
      </div>
      {Number(amountPages || 0) > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          بعد التسجيل هيتبقى عليك تقريبا {formatNumber(remainingAfterThisWeek)} صفحة.
        </p>
      )}
    </form>
  );
}

function QuranBadgesPanel({ badges }) {
  const quranBadges = QURAN_BADGE_KEYS
    .map((key) => badges.find((badge) => badge.key === key))
    .filter(Boolean);

  if (!quranBadges.length) return null;

  return (
    <section className="rounded-lg border-2 border-border bg-background/75 p-5 text-right">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Medal className="h-7 w-7 text-primary" />
        <div>
          <h2 className="text-xl font-black text-foreground">أوسمة القرآن</h2>
          <p className="mt-1 text-sm text-muted-foreground">المواظبة الأسبوعية ومراحل الحفظ تظهر هنا أول ما تتحقق.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        {quranBadges.map((badge) => {
          const earned = Boolean(badge.isEarned);
          return (
            <article
              key={badge.key}
              className={cn(
                'rounded-lg border-2 p-4 transition',
                earned
                  ? 'border-primary/60 bg-primary/15 shadow-[0_5px_0_rgba(6,182,212,0.2)]'
                  : 'border-border bg-muted/20 opacity-75',
              )}
            >
              <div className="mb-4 flex justify-end">
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-md', earned ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                  {earned ? <Medal className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </span>
              </div>
              <h3 className="text-base font-black text-foreground">{badge.name ?? badge.key}</h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{badge.description}</p>
              <p className={cn('mt-3 text-xs font-black', earned ? 'text-primary' : 'text-muted-foreground')}>
                {earned ? `مكتسب ${formatDate(badge.earnedAt)}` : 'لم يكتسب بعد'}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function HistoryTable({ logs }) {
  if (!logs.length) return null;

  return (
    <section className="rounded-lg border-2 border-border bg-background/75 p-5">
      <div className="mb-4 text-right">
        <h2 className="text-xl font-black text-foreground">آخر التسجيلات</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-right">
          <thead className="border-b border-border text-sm text-muted-foreground">
            <tr>
              <th className="p-3">الأسبوع</th>
              <th className="p-3">النوع</th>
              <th className="p-3">المقدار</th>
              <th className="p-3">الإجمالي بعده</th>
            </tr>
          </thead>
          <tbody>
            {logs.slice(0, 5).map((log) => (
              <tr key={log.id} className="border-b border-border/70 last:border-0">
                <td className="p-3 font-bold">{formatDate(log.weekStartDate)}</td>
                <td className="p-3">{log.trackType === 'MEMORIZING' ? 'حفظ' : 'مراجعة'}</td>
                <td className="p-3">{formatNumber(log.amountPages)} صفحة</td>
                <td className="p-3">{log.cumulativeAfter ? `${formatNumber(log.cumulativeAfter)} صفحة` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function QuranPage() {
  const queryClient = useQueryClient();
  const progressQuery = useQuery({
    queryKey: ['quranProgress'],
    queryFn: QuranService.getProgress,
  });
  const historyQuery = useQuery({
    queryKey: ['quranHistory'],
    queryFn: () => QuranService.getHistory({ page: 1, limit: 12 }),
    enabled: Boolean(progressQuery.data?.progress),
  });

  const progress = progressQuery.data?.progress;
  const logs = historyQuery.data?.logs ?? [];
  const badges = useMemo(() => progress?.badges ?? [], [progress]);

  const setupMutation = useMutation({
    mutationFn: QuranService.setup,
    onSuccess: () => {
      toast.success('تم حفظ بداية مسار القرآن');
      queryClient.invalidateQueries({ queryKey: ['quranProgress'] });
      queryClient.invalidateQueries({ queryKey: ['quranHistory'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'تعذر حفظ البداية'),
  });

  const logMutation = useMutation({
    mutationFn: QuranService.submitWeeklyLog,
    onSuccess: (data) => {
      toast.success(data?.transitionedToReviewing ? 'مبارك الختم، تم تحويلك لمسار المراجعة' : 'تم تسجيل الأسبوع');
      queryClient.invalidateQueries({ queryKey: ['quranProgress'] });
      queryClient.invalidateQueries({ queryKey: ['quranHistory'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'تعذر تسجيل الأسبوع'),
  });

  const targetMutation = useMutation({
    mutationFn: QuranService.updateWeeklyTarget,
    onSuccess: () => {
      toast.success('تم تحديث المعدل');
      queryClient.invalidateQueries({ queryKey: ['quranProgress'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'تعذر تحديث المعدل'),
  });

  if (progressQuery.isLoading) return <QuranSkeleton />;

  if (progressQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border-2 border-border bg-background/80 p-8 text-center">
        <h1 className="text-2xl font-black">تعذر تحميل بيانات القرآن</h1>
        <Button className="mt-5" onClick={() => progressQuery.refetch()}>إعادة المحاولة</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="rounded-lg border-2 border-border bg-background/80 p-5 text-right shadow-[0_6px_0_rgba(6,182,212,0.22)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {progress && <TargetDialog progress={progress} onUpdate={targetMutation.mutate} isPending={targetMutation.isPending} />}
          <div>
            <p className="text-sm font-black text-primary">القرآن</p>
            <h1 className="mt-1 text-3xl font-black text-foreground">الحفظ والمراجعة</h1>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              هنا تتابع أسبوعك، المتبقي للشهر، والمدة التقريبية حسب معدلك الحالي.
            </p>
          </div>
        </div>
      </header>

      {!progress ? (
        <SetupPanel onSetup={setupMutation.mutate} isPending={setupMutation.isPending} />
      ) : (
        <>
          <SummaryCards progress={progress} logs={logs} />
          <WeeklyLogPanel progress={progress} logs={logs} onSubmit={logMutation.mutate} isPending={logMutation.isPending} />
          <QuranBadgesPanel badges={badges} />
          {historyQuery.isLoading ? <Skeleton className="h-44 rounded-lg" /> : <HistoryTable logs={logs} />}
        </>
      )}
    </div>
  );
}
