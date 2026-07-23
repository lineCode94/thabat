import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ReviewCard } from '@/features/reviews/components/ReviewCard';
import { WeeklyReviewService } from '@/features/reviews/services/weekly-review.service';

export function UserReviewsPage() {
  const { t } = useTranslation(['reviews']);
  const reviewsQuery = useQuery({
    queryKey: ['weeklyReviews', 'own'],
    queryFn: () => WeeklyReviewService.listReviews({ status: 'COMPLETED', limit: 20 }),
  });
  const reviews = reviewsQuery.data?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-2xl border border-violet-100 bg-white/90 p-6 shadow-sm dark:border-violet-900/40 dark:bg-slate-900/90">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {t('user.eyebrow')}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          {t('user.title')}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t('user.description')}
        </p>
      </section>

      {reviewsQuery.isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
          ))}
        </div>
      )}

      {reviewsQuery.isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {t('states.error')}
        </div>
      )}

      {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length === 0 && (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center dark:border-slate-700 dark:bg-slate-900/70">
          <ClipboardCheck className="text-primary" size={34} />
          <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
            {t('states.emptyUserTitle')}
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            {t('states.emptyUserDescription')}
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} basePath="/reviews" />
        ))}
      </div>
    </div>
  );
}
