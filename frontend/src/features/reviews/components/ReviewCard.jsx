import { CalendarDays, ChevronRight, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { ReviewStatusBadge } from '@/features/reviews/components/ReviewStatusBadge';

function formatDate(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(date));
}

export function ReviewCard({ review, basePath = '/mentor/reviews' }) {
  const { t } = useTranslation(['reviews']);

  return (
    <Link
      to={`${basePath}/${review.id}`}
      className="group block rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-slate-800 dark:bg-slate-900/90"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <ReviewStatusBadge status={review.status} />
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">
            {review.user?.fullName ?? t('labels.weeklyReview')}
          </h2>
        </div>
        <ChevronRight className="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-primary rtl:rotate-180 rtl:group-hover:-translate-x-1" size={18} />
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-500 dark:text-slate-400 sm:grid-cols-2">
        <span className="inline-flex items-center gap-2">
          <CalendarDays size={16} />
          {t('labels.weekOf', { date: formatDate(review.weekStartDate) })}
        </span>
        {review.mentor?.fullName && (
          <span className="inline-flex items-center gap-2">
            <UserRound size={16} />
            {review.mentor.fullName}
          </span>
        )}
      </div>
    </Link>
  );
}
