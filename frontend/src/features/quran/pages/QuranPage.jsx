import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, CalendarCheck, CheckCircle2, Clock3, Edit3, RotateCcw, Save } from 'lucide-react';
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
const WEEKS_PER_MONTH = 4;

const TRACKS = {
  MEMORIZING: {
    title: 'لسه بحفظ',
    description: 'اكتب عدد الصفحات المحفوظة ومعدل الحفظ الأسبوعي.',
    icon: BookOpen,
  },
  REVIEWING: {
    title: 'حافظ',
    description: 'سجل مراجعتك الأسبوعية بالصفحات.',
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

function QuranSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Skeleton className="h-28 rounded-lg" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
      <Skeleton className="h-44 rounded-lg" />
    </div>
  );
}

function SetupPanel({ onSetup, isPending }) {
  const [trackType, setTrackType] = useState('MEMORIZING');
  const [savedPagesInput, setSavedPagesInput] = useState('');
  const [weeklyTargetInput, setWeeklyTargetInput] = useState('');
  const savedPages = Number(savedPagesInput || (trackType === 'REVIEWING' ? QURAN_TOTAL_PAGES : 0));
  const weeklyTargetPages = Number(weeklyTargetInput || 0);
  const remainingPages = Math.max(0, QURAN_TOTAL_PAGES - savedPages);
  const expectedMonthPages = weeklyTargetPages > 0 ? Math.min(remainingPages, Math.round(weeklyTargetPages * WEEKS_PER_MONTH)) : 0;
  const estimatedMonths = weeklyTargetPages > 0 ? Math.ceil(remainingPages / weeklyTargetPages / WEEKS_PER_MONTH) : null;

  function handleSubmit(event) {
    event.preventDefault();
    onSetup({
      trackType,
      cumulativePagesMemorized: savedPages,
      weeklyTargetPages: trackType === 'MEMORIZING' ? weeklyTargetPages : undefined,
    });
  }

  return (
    <form className="grid gap-5 lg:grid-cols-[1fr_340px]" onSubmit={handleSubmit}>
      <section className="grid gap-4 md:grid-cols-2">
        {Object.entries(TRACKS).map(([key, track]) => {
          const Icon = track.icon;
          const selected = trackType === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setTrackType(key)}
              className={cn(
                'rounded-lg border-2 bg-background/80 p-5 text-right transition',
                selected ? 'border-primary shadow-[0_8px_0_rgba(6,182,212,0.38)]' : 'border-border hover:border-primary/60',
              )}
            >
              <div className="mb-8 flex items-center justify-between">
                <span className={cn('rounded-md px-3 py-1 text-xs font-black', selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                  {selected ? 'المسار المختار' : 'اختر'}
                </span>
                <Icon className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-black text-foreground">{track.title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{track.description}</p>
            </button>
          );
        })}
      </section>

      <section className="rounded-lg border-2 border-border bg-background/90 p-5 text-right">
        <h2 className="text-xl font-black text-foreground">بيانات البداية</h2>
        <div className="mt-5 space-y-4">
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">الصفحات المحفوظة حاليًا</span>
            <Input
              className="h-12 border-2 bg-background text-lg font-bold"
              min="0"
              max={QURAN_TOTAL_PAGES}
              step="1"
              type="number"
              value={savedPagesInput}
              onChange={(event) => setSavedPagesInput(event.target.value)}
              placeholder={trackType === 'REVIEWING' ? '604' : 'مثال: 40'}
            />
          </label>

          {trackType === 'MEMORIZING' && (
            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">هدفك الأسبوعي بالصفحات</span>
              <Input
                className="h-12 border-2 bg-background text-lg font-bold"
                min="1"
                max={QURAN_TOTAL_PAGES}
                step="1"
                type="number"
                value={weeklyTargetInput}
                onChange={(event) => setWeeklyTargetInput(event.target.value)}
                placeholder="مثال: 5"
              />
            </label>
          )}

          {trackType === 'MEMORIZING' && weeklyTargetPages > 0 && (
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm leading-7 text-muted-foreground">
              الشهر محسوب 4 أسابيع: متوقع {formatNumber(expectedMonthPages)} صفحة، والختم بعد حوالي {formatNumber(estimatedMonths)} شهر.
            </div>
          )}

          <Button className="h-12 w-full text-base font-black" disabled={isPending} type="submit">
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
  const estimatedMonths = progress.trackType === 'MEMORIZING' && weeklyTargetPages > 0
    ? Math.ceil(remainingAll / weeklyTargetPages / WEEKS_PER_MONTH)
    : null;

  const cards = [
    {
      title: progress.trackType === 'MEMORIZING' ? 'حفظت الأسبوع ده' : 'راجعت الأسبوع ده',
      value: `${formatNumber(currentWeekLog?.amountPages ?? 0)} صفحة`,
      hint: currentWeekLog ? `تم التسجيل يوم ${formatDate(currentWeekLog.createdAt)}` : 'لسه مفيش تسجيل للأسبوع الحالي',
      icon: CalendarCheck,
      active: Boolean(currentWeekLog),
    },
    {
      title: 'متبقي للشهر ده',
      value: progress.trackType === 'MEMORIZING' ? `${formatNumber(remainingThisMonth)} صفحة` : 'ثبات مراجعة',
      hint: progress.trackType === 'MEMORIZING'
        ? `هدف الشهر 4 أسابيع: ${formatNumber(monthTargetPages)} صفحة`
        : 'المراجعة هدفها الاستمرار لا الختم',
      icon: Clock3,
      active: true,
    },
    {
      title: 'المتبقي للختم',
      value: progress.trackType === 'MEMORIZING' ? `${formatNumber(remainingAll)} صفحة` : 'لا يوجد',
      hint: estimatedMonths ? `لو كملت بنفس المعدل: حوالي ${formatNumber(estimatedMonths)} شهر` : 'أنت الآن في مسار المراجعة',
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
  const estimatedMonths = weeklyPages > 0 ? Math.ceil(remainingPages / weeklyPages / WEEKS_PER_MONTH) : null;
  const monthTargetPages = weeklyPages > 0 ? Math.round(weeklyPages * WEEKS_PER_MONTH) : 0;

  if (progress.trackType !== 'MEMORIZING') return null;

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
          تعديل المعدل
        </Button>
      </DialogTrigger>
      <DialogContent className="border-2 text-right shadow-[0_10px_0_rgba(6,182,212,0.28)]">
        <DialogHeader className="text-right">
          <DialogTitle className="text-2xl font-black">تعديل معدل الحفظ</DialogTitle>
          <DialogDescription className="leading-7">
            غير عدد الصفحات اللي ناوي تحفظها أسبوعيًا، والحسابات هتتحدث بناءً على المعدل الجديد.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-black text-muted-foreground">المعدل الأسبوعي بالصفحات</span>
            <Input
              className="h-12 border-2 bg-background text-lg font-bold"
              min="1"
              max={QURAN_TOTAL_PAGES}
              step="1"
              type="number"
              value={weeklyTargetPages}
              onChange={(event) => setWeeklyTargetPages(event.target.value)}
              placeholder="مثال: 5"
            />
          </label>

          {weeklyPages > 0 && (
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm leading-7 text-muted-foreground">
              بالمعدل ده هتحفظ تقريبًا {formatNumber(monthTargetPages)} صفحة في الشهر، وتختم بعد حوالي {formatNumber(estimatedMonths)} شهر.
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
  const isMemorizing = progress.trackType === 'MEMORIZING';
  const remainingAfterThisWeek = isMemorizing
    ? Math.max(0, Number(progress.remainingPages ?? 0) - Number(amountPages || 0))
    : null;

  if (currentWeekLog) {
    return (
      <section className="rounded-lg border-2 border-emerald-500/40 bg-emerald-500/10 p-5 text-right">
        <div className="flex items-start justify-between gap-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          <div>
            <h2 className="text-2xl font-black text-foreground">تم تسجيل الأسبوع الحالي</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {isMemorizing ? 'حفظت' : 'راجعت'} هذا الأسبوع {formatNumber(currentWeekLog.amountPages)} صفحة.
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
          <span className="text-sm font-black text-muted-foreground">
            {isMemorizing ? 'كم صفحة حفظت هذا الأسبوع؟' : 'كم صفحة راجعت هذا الأسبوع؟'}
          </span>
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
        <Button className="h-12 px-6 text-base font-black" disabled={isPending} type="submit">
          <CheckCircle2 />
          تسجيل الأسبوع
        </Button>
      </div>
      {remainingAfterThisWeek != null && Number(amountPages || 0) > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          بعد التسجيل هيتبقى عليك تقريبًا {formatNumber(remainingAfterThisWeek)} صفحة للختم.
        </p>
      )}
    </form>
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
  const badges = useMemo(() => progressQuery.data?.badgesEarned ?? progressQuery.data?.badges ?? [], [progressQuery.data]);

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
      toast.success('تم تحديث معدل الحفظ');
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
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="rounded-lg border-2 border-border bg-background/80 p-5 text-right shadow-[0_6px_0_rgba(6,182,212,0.22)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {progress?.trackType === 'MEMORIZING' && (
            <TargetDialog progress={progress} onUpdate={targetMutation.mutate} isPending={targetMutation.isPending} />
          )}
          <div>
            <p className="text-sm font-black text-primary">القرآن</p>
            <h1 className="mt-1 text-3xl font-black text-foreground">ملخص الحفظ والمراجعة</h1>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              هنا تتابع أسبوعك، المتبقي للشهر، والمدة التقريبية للختم حسب معدلك الحالي.
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
          {!!badges.length && (
            <section className="rounded-lg border-2 border-border bg-background/75 p-5 text-right">
              <h2 className="text-lg font-black">الأوسمة المكتسبة</h2>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                {badges.map((badge) => (
                  <span key={badge.id ?? badge.key} className="rounded-md border border-primary/40 bg-primary/15 px-3 py-2 text-sm font-bold">
                    {badge.name ?? badge.key}
                  </span>
                ))}
              </div>
            </section>
          )}
          {historyQuery.isLoading ? <Skeleton className="h-44 rounded-lg" /> : <HistoryTable logs={logs} />}
        </>
      )}
    </div>
  );
}
