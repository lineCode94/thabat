import { CheckCircle2, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function CriteriaList({ criteria = [] }) {
  const { t } = useTranslation(['promotion']);

  return (
    <div className="space-y-3">
      {criteria.map((criterion) => {
        const Icon = criterion.passed ? CheckCircle2 : Circle;
        return (
          <div key={criterion.key} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-3">
              <Icon className={criterion.passed ? 'text-emerald-500' : 'text-slate-400'} size={18} />
              <span className="font-medium text-slate-800 dark:text-slate-100">
                {t(`criteria.${criterion.key}`)}
              </span>
            </div>
            <span className="text-slate-500 dark:text-slate-400">
              {String(criterion.currentValue)} / {String(criterion.targetValue)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
