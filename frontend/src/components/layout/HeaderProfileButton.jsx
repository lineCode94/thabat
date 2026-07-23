import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { getUserInitials } from '@/lib/user';

export function HeaderProfileButton({ user }) {
  const { t } = useTranslation(['layout']);
  const initials = getUserInitials(user?.fullName);

  return (
    <Link
      to="/profile"
      aria-label={t('header.openProfile')}
      title={t('header.openProfile')}
      className="neo-nav-control flex h-10 w-10 items-center justify-center rounded-xl border-2 text-sm font-bold text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {initials}
      </span>
    </Link>
  );
}
