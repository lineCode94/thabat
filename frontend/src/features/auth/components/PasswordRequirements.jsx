import { CheckCircle2, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const REQUIREMENTS = [
  {
    key: 'min',
    labelKey: 'passwordMinShort',
    test: (value) => value.length >= 8,
  },
  {
    key: 'uppercase',
    labelKey: 'passwordUppercaseShort',
    test: (value) => /[A-Z]/.test(value),
  },
  {
    key: 'number',
    labelKey: 'passwordNumberShort',
    test: (value) => /[0-9]/.test(value),
  },
];

export function PasswordRequirements({ value = '', visible = false }) {
  const { t } = useTranslation(['validation']);

  if (!visible && !value) return null;

  return (
    <div id="password-requirements" className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/55">
      <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        {t('passwordRequirements')}
      </p>
      <ul className="space-y-1.5">
        {REQUIREMENTS.map((requirement) => {
          const isValid = requirement.test(value);
          const Icon = isValid ? CheckCircle2 : Circle;

          return (
            <li
              key={requirement.key}
              className={isValid ? 'flex items-center gap-2 text-xs text-primary' : 'flex items-center gap-2 text-xs text-slate-400'}
            >
              <Icon size={14} />
              <span>{t(requirement.labelKey)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
