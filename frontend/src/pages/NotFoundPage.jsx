import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/constants';

export function NotFoundPage() {
  const { t } = useTranslation(['common']);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">{t('states.notFound')}</p>
      <Button asChild>
        <Link to={APP_ROUTES.HOME}>{t('home.getStarted')}</Link>
      </Button>
    </section>
  );
}
