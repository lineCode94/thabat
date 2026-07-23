import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemAnim = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function CategorySectionSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-7 w-40 rounded" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CategorySectionEmpty() {
  const { t } = useTranslation(['tracking']);

  return (
    <div className="py-20 text-center text-slate-500">
      <p className="text-lg font-medium">{t('emptyCategories')}</p>
      <p className="mt-1 text-sm">{t('emptyCategoriesDescription')}</p>
    </div>
  );
}

export function CategorySection({ category, items, WorshipItemCard }) {
  if (!items || items.length === 0) return null;

  return (
    <section aria-labelledby={`cat-${category.id}`}>
      <h2
        id={`cat-${category.id}`}
        className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-700 dark:text-slate-200"
      >
        {category.icon && <span aria-hidden="true">{category.icon}</span>}
        {category.name}
      </h2>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {items.map((item) => (
          <motion.div key={item.id} variants={itemAnim}>
            <WorshipItemCard item={item} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
