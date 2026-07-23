import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { CriteriaList } from '@/features/promotion/components/CriteriaList';
import { PromotionStatusBadge } from '@/features/promotion/components/PromotionStatusBadge';
import { PromotionService } from '@/features/promotion/services/promotion.service';

export function PromotionRecommendationsPage() {
  const { t } = useTranslation(['promotion']);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const promotionsQuery = useQuery({
    queryKey: ['promotions'],
    queryFn: () => PromotionService.listPromotions({ limit: 20 }),
  });

  const readinessQuery = useQuery({
    queryKey: ['promotionReadiness', selectedUserId],
    queryFn: () => PromotionService.getReadiness(selectedUserId),
    enabled: Boolean(selectedUserId),
  });

  const createMutation = useMutation({
    mutationFn: () => PromotionService.createRecommendation(selectedUserId, { reason }),
    onSuccess: (promotion) => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      navigate(`/promotions/${promotion.id}`);
    },
  });

  const promotions = promotionsQuery.data?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-2xl border border-violet-100 bg-white/90 p-6 shadow-sm dark:border-violet-900/40 dark:bg-slate-900/90">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t('eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{t('title')}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{t('description')}</p>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder={t('userIdPlaceholder')}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950"
            />
          </div>
          <Button type="button" onClick={() => setSelectedUserId(userId.trim())} disabled={!userId.trim()}>
            {t('actions.evaluate')}
          </Button>
        </div>
      </section>

      {readinessQuery.data && (
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{t('readinessTitle')}</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {readinessQuery.data.currentLevel.name}
                <ArrowRight className="mx-2 inline rtl:rotate-180" size={16} />
                {readinessQuery.data.recommendedLevel.name}
              </p>
            </div>
            <div className="text-3xl font-bold text-primary">{readinessQuery.data.progress}%</div>
          </div>
          <div className="mt-5">
            <CriteriaList criteria={readinessQuery.data.criteria} />
          </div>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t('reasonPlaceholder')}
            className="mt-4 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950"
          />
          <Button
            className="mt-4"
            type="button"
            disabled={createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {t('actions.createRecommendation')}
          </Button>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {promotions.map((promotion) => (
          <Link key={promotion.id} to={`/promotions/${promotion.id}`} className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:border-primary/40 dark:border-slate-800 dark:bg-slate-900/90">
            <PromotionStatusBadge status={promotion.status} />
            <h2 className="mt-3 text-base font-semibold text-slate-950 dark:text-white">{promotion.user.fullName}</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span>{promotion.previousLevel.name}</span>
              <ArrowRight className="rtl:rotate-180" size={15} />
              <span>{promotion.nextLevel.name}</span>
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
