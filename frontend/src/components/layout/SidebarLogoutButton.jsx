import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

export function SidebarLogoutButton({ collapsed = false, onLogout, onNavigate }) {
  const { t } = useTranslation(['layout']);
  const label = t('navigation.logout');

  const handleLogout = () => {
    onNavigate?.();
    onLogout();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      title={collapsed ? label : undefined}
      aria-label={label}
      className={cn(
        'flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-300',
        collapsed && 'justify-center px-2',
      )}
    >
      <LogOut size={18} />
      {!collapsed && <span className="flex-1 text-start">{label}</span>}
    </button>
  );
}
