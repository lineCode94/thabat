import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ReviewStatusBadge } from '@/features/reviews/components/ReviewStatusBadge';
import { WeeklyReviewService } from '@/features/reviews/services/weekly-review.service';

function normalizeForm(review) {
  return {
    comment: review?.comment ?? '',
    privateNotes: review?.privateNotes ?? '',
    rating: review?.rating ?? '',
    recommendation: review?.recommendation ?? '',
    promotionSuggestion: Boolean(review?.promotionSuggestion),
  };
}

export function ReviewDetailPage({ userView = false }) {
  const { t } = useTranslation(['common', 'reviews']);
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(normalizeForm(null));

  const reviewQuery = useQuery({
    queryKey: ['weeklyReview', id],
    queryFn: () => WeeklyReviewService.getReview(id),
  });

  useEffect(() => {
    if (reviewQuery.data) {
      setForm(normalizeForm(reviewQuery.data));
    }
  }, [reviewQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => WeeklyReviewService.updateReview(id, {
      comment: form.comment || null,
      privateNotes: form.privateNotes || null,
      rating: form.rating ? Number(form.rating) : null,
      recommendation: form.recommendation || null,
      promotionSuggestion: form.promotionSuggestion,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklyReview', id] });
      queryClient.invalidateQueries({ queryKey: ['weeklyReviews'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => WeeklyReviewService.completeReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklyReview', id] });
      queryClient.invalidateQueries({ queryKey: ['weeklyReviews'] });
    },
  });

  if (reviewQuery.isLoading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />;
  }

  if (reviewQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
        {t('reviews:states.error')}
      </div>
    );
  }

  const review = reviewQuery.data;
  const isCompleted = review.status === 'COMPLETED';
  const readOnly = userView || isCompleted;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-2xl border border-violet-100 bg-white/90 p-6 shadow-sm dark:border-violet-900/40 dark:bg-slate-900/90">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <ReviewStatusBadge status={review.status} />
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              {userView ? t('reviews:user.detailTitle') : t('reviews:detail.title')}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {review.user?.fullName ?? review.mentor?.fullName}
            </p>
          </div>

          {!userView && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={readOnly || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                <Save size={17} />
                {t('reviews:actions.saveDraft')}
              </Button>
              <Button
                type="button"
                disabled={isCompleted || completeMutation.isPending}
                onClick={() => completeMutation.mutate()}
              >
                <Send size={17} />
                {t('reviews:actions.complete')}
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t('reviews:fields.comment')}
            </span>
            <textarea
              value={form.comment}
              readOnly={readOnly}
              onChange={(event) => setForm((state) => ({ ...state, comment: event.target.value }))}
              className="min-h-36 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 read-only:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:read-only:bg-slate-950/60"
            />
          </label>

          {!userView && (
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t('reviews:fields.privateNotes')}
              </span>
              <textarea
                value={form.privateNotes}
                readOnly={readOnly}
                onChange={(event) => setForm((state) => ({ ...state, privateNotes: event.target.value }))}
                className="min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 read-only:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:read-only:bg-slate-950/60"
              />
            </label>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t('reviews:fields.rating')}
            </span>
            <input
              type="number"
              min="1"
              max="5"
              value={form.rating}
              readOnly={readOnly}
              onChange={(event) => setForm((state) => ({ ...state, rating: event.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 read-only:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:read-only:bg-slate-950/60"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t('reviews:fields.recommendation')}
            </span>
            <textarea
              value={form.recommendation}
              readOnly={readOnly}
              onChange={(event) => setForm((state) => ({ ...state, recommendation: event.target.value }))}
              className="min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 read-only:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:read-only:bg-slate-950/60"
            />
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium dark:border-slate-800">
            <input
              type="checkbox"
              checked={form.promotionSuggestion}
              disabled={readOnly}
              onChange={(event) => setForm((state) => ({ ...state, promotionSuggestion: event.target.checked }))}
              className="h-4 w-4 accent-primary"
            />
            {t('reviews:fields.promotionSuggestion')}
          </label>
        </div>
      </section>
    </div>
  );
}
