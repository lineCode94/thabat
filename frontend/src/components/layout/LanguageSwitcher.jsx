import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useLayoutStore } from '@/store/useLayoutStore';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLayoutStore();
  const { t } = useTranslation(['layout']);
  const nextLanguage = language === 'en' ? 'ar' : 'en';

  return (
    <button
      type="button"
      onClick={() => setLanguage(nextLanguage)}
      className="neo-nav-control inline-flex h-10 items-center gap-2 rounded-xl border-2 px-3 text-sm font-medium text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-slate-300"
      aria-label={t('header.switchLanguage')}
    >
      <Languages size={16} />
      <span className="hidden sm:inline">{t('header.currentLanguage')}</span>
    </button>
  );
}
