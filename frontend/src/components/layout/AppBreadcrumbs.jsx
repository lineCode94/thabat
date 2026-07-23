import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { flattenNavigation } from './appNavigation';

const CUSTOM_LABELS = {
  reports: 'breadcrumbs.reports',
  daily: 'breadcrumbs.daily',
  weekly: 'breadcrumbs.weekly',
  monthly: 'breadcrumbs.monthly',
  yearly: 'breadcrumbs.yearly',
};

function toTitleCase(value) {
  return value
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function AppBreadcrumbs() {
  const location = useLocation();
  const { t } = useTranslation(['layout']);
  const navItems = flattenNavigation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0 || location.pathname === '/dashboard') {
    return <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('breadcrumbs.dashboard')}</span>;
  }

  const crumbs = [
    { label: t('breadcrumbs.dashboard'), to: '/dashboard' },
    ...segments.map((segment, index) => {
      const to = `/${segments.slice(0, index + 1).join('/')}`;
      const navItem = navItems.find((item) => item.to === to);
      return {
        label: navItem?.labelKey ? t(navItem.labelKey) : t(CUSTOM_LABELS[segment], toTitleCase(segment)),
        to,
      };
    }),
  ];

  return (
    <nav className="flex min-w-0 items-center gap-1 text-sm" aria-label={t('breadcrumbs.dashboard')}>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <div key={`${crumb.to}-${index}`} className="flex min-w-0 items-center gap-1">
            {index > 0 && (
              <ChevronRight size={14} className="shrink-0 text-slate-400 rtl:rotate-180" />
            )}
            {isLast ? (
              <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.to}
                className="truncate text-slate-500 transition-colors hover:text-primary dark:text-slate-400"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
