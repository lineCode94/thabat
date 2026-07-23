import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationDropdown } from '@/features/notifications/components';
import { useLayoutStore } from '@/store/useLayoutStore';

import { AppBreadcrumbs } from './AppBreadcrumbs';
import { HeaderProfileButton } from './HeaderProfileButton';
import { LanguageSwitcher } from './LanguageSwitcher';

export function AppHeader({ user }) {
  const { openMobileSidebar } = useLayoutStore();
  const { t } = useTranslation(['layout']);

  return (
    <header className="neo-navbar sticky top-0 z-40 border-b-2 bg-background/92 backdrop-blur-xl">
      <div className="flex min-h-16 items-center gap-3 px-4 lg:px-6">
        <button
          type="button"
          onClick={openMobileSidebar}
          className="neo-nav-control rounded-xl p-2 text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-slate-300 lg:hidden"
          aria-label={t('header.openNavigation')}
        >
          <Menu size={22} />
        </button>

        <div className="min-w-0 flex-1">
          <AppBreadcrumbs />
        </div>

        <div className="flex items-center gap-2">
          <NotificationDropdown />
          <LanguageSwitcher />
          <ThemeToggle />
          <HeaderProfileButton user={user} />
        </div>
      </div>
    </header>
  );
}
