import { useTranslation } from 'react-i18next';

import { AuthBrand } from '../components/AuthBrand';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  const { t } = useTranslation(['auth']);

  return (
    <div className="space-y-8">
      <div className="hidden lg:block">
        <AuthBrand />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary rtl:normal-case rtl:tracking-normal">
          {t('login.eyebrow')}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          {t('pages.loginTitle')}
        </h1>
        <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t('login.subtitle')}
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
