import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { env } from '@/config/env';

export function HomePage() {
  const { t } = useTranslation(['common']);

  return (
    <section className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight">{env.VITE_APP_NAME}</h1>
      <p className="max-w-lg text-muted-foreground">
        {t('home.description')}
      </p>
      <Button>{t('home.getStarted')}</Button>
    </section>
  );
}
