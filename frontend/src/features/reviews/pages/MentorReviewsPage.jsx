import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ReviewCard } from '@/features/reviews/components/ReviewCard';
import { WeeklyReviewService } from '@/features/reviews/services/weekly-review.service';

export function MentorReviewsPage() {
  const { t } = useTranslation(['common', 'reviews']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState('');

  const reviewsQuery = useQuery({
    queryKey: ['weeklyReviews', 'mentor'],
    queryFn: () => WeeklyReviewService.listReviews({ limit: 20 }),
  });

  const initializeMutation = useMutation({
    mutationFn: () => WeeklyReviewService.initializeCurrentReview(userId.trim()),
    onSuccess: (review) => {
      queryClient.invalidateQueries({ queryKey: ['weeklyReviews'] });
      navigate(`/mentor/reviews/${review.id}`);
    },
  });

  const reviews = reviewsQuery.data?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-2xl border border-violet-100 bg-white/90 p-6 shadow-sm dark:border-violet-900/40 dark:bg-slate-900/90">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {t('reviews:mentor.eyebrow')}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              {t('reviews:mentor.title')}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t('reviews:mentor.description')}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl">
            <label className="sr-only" htmlFor="weekly-review-user-id">
              {t('reviews:mentor.userIdLabel')}
            </label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                id="weekly-review-user-id"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                placeholder={t('reviews:mentor.userIdPlaceholder')}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950"
              />
            </div>
            <Button
              type="button"
              disabled={!userId.trim() || initializeMutation.isPending}
              onClick={() => initializeMutation.mutate()}
            >
              <Plus size={17} />
              {t('reviews:mentor.initialize')}
            </Button>
          </div>
        </div>
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
          {t('reviews:states.error')}
        </div>
      )}

      {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length === 0 && (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center dark:border-slate-700 dark:bg-slate-900/70">
          <ClipboardCheck className="text-primary" size={34} />
          <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
            {t('reviews:states.emptyTitle')}
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            {t('reviews:states.emptyDescription')}
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}
