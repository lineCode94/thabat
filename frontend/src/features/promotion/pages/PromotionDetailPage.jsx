import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { CriteriaList } from '@/features/promotion/components/CriteriaList';
import { PromotionStatusBadge } from '@/features/promotion/components/PromotionStatusBadge';
import { PromotionService } from '@/features/promotion/services/promotion.service';

export function PromotionDetailPage() {
  const { t } = useTranslation(['promotion']);
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [decisionNotes, setDecisionNotes] = useState('');

  const promotionQuery = useQuery({
    queryKey: ['promotion', id],
    queryFn: () => PromotionService.getPromotion(id),
  });

  const approveMutation = useMutation({
    mutationFn: () => PromotionService.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promotion', id] }),
  });

  const declineMutation = useMutation({
    mutationFn: () => PromotionService.decline(id, { decisionNotes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promotion', id] }),
  });

  if (promotionQuery.isLoading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />;
  }

  if (promotionQuery.isError) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">{t('states.error')}</div>;
  }

  const promotion = promotionQuery.data;
  const actionable = promotion.status === 'PENDING';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-2xl border border-violet-100 bg-white/90 p-6 shadow-sm dark:border-violet-900/40 dark:bg-slate-900/90">
        <PromotionStatusBadge status={promotion.status} />
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{promotion.user.fullName}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {promotion.previousLevel.name}
          <ArrowRight className="mx-2 inline rtl:rotate-180" size={16} />
          {promotion.nextLevel.name}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{t('criteriaTitle')}</h2>
        <div className="mt-4">
          <CriteriaList criteria={promotion.readinessSnapshot?.criteria ?? []} />
        </div>
      </section>

      {actionable && (
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <textarea
            value={decisionNotes}
            onChange={(event) => setDecisionNotes(event.target.value)}
            placeholder={t('decisionNotesPlaceholder')}
            className="min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
              {t('actions.approve')}
            </Button>
            <Button type="button" variant="outline" onClick={() => declineMutation.mutate()} disabled={declineMutation.isPending}>
              {t('actions.decline')}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
