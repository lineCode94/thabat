import { useQuery } from '@tanstack/react-query';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import {
  CategorySection,
  CategorySectionEmpty,
  CategorySectionSkeleton,
} from '../components/CategorySection';
import { WorshipItemCard } from '../components/WorshipItemCard';
import { WorshipService } from '../services/worship.service';

export function WorshipPage() {
  const { t } = useTranslation(['common', 'tracking']);
  const {
    data: categories,
    isLoading: catsLoading,
    isError: catsError,
    refetch: refetchCats,
  } = useQuery({
    queryKey: ['worshipCategories'],
    queryFn: () => WorshipService.getCategories(),
  });

  const {
    data: items,
    isLoading: itemsLoading,
    isError: itemsError,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ['worshipItems'],
    queryFn: () => WorshipService.getItems(),
  });

  const isLoading = catsLoading || itemsLoading;
  const isError = catsError || itemsError;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold">{t('tracking:worshipLibrary')}</h1>
        <CategorySectionSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex min-h-[400px] max-w-4xl flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="text-red-500" size={40} />
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
          {t('tracking:loadFailed')}
        </p>
        <p className="text-sm text-slate-500">{t('tracking:connectionProblem')}</p>
        <Button
          variant="outline"
          onClick={() => {
            refetchCats();
            refetchItems();
          }}
          className="gap-2"
        >
          <RefreshCw size={16} />
          {t('common:actions.retry')}
        </Button>
      </div>
    );
  }

  if (!categories?.length) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold">{t('tracking:worshipLibrary')}</h1>
        <CategorySectionEmpty />
      </div>
    );
  }

  const itemsByCategory = (items || []).reduce((acc, item) => {
    (acc[item.categoryId] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t('tracking:worshipLibrary')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('tracking:worshipDescription')}</p>
      </div>

      {categories.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          items={itemsByCategory[category.id] || []}
          WorshipItemCard={WorshipItemCard}
        />
      ))}
    </div>
  );
}
