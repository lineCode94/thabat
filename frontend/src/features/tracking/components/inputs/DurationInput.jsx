import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';

export function DurationInput({ item, value, onChange }) {
  const { t } = useTranslation(['common']);
  const label = item.title ?? item.name;
  const targetValue = Number(item.targetValue ?? 0);
  const currentValue = Number(value?.duration ?? 0);

  return (
    <div className="flex flex-col gap-2 rounded-md border p-4">
      <label className="font-medium">{label}</label>
      <div className="flex items-center gap-4">
        <Input 
          type="number"
          min="0"
          value={currentValue}
          onChange={(e) => {
            const duration = parseInt(e.target.value) || 0;
            onChange({ duration, isCompleted: targetValue > 0 ? duration >= targetValue : duration > 0 });
          }}
          className="w-24"
        />
        <span className="text-sm text-gray-500">
          {targetValue > 0 ? `${currentValue}/${targetValue}` : t('units.minutes')}
        </span>
      </div>
    </div>
  );
}
