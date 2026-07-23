import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ThabatLogo } from '@/components/branding/ThabatLogo';
import { cn } from '@/lib/utils';
import { useLayoutStore } from '@/store/useLayoutStore';

import { appNavigation } from './appNavigation';
import { AppSidebarNav } from './AppSidebarNav';
import { SidebarLogoutButton } from './SidebarLogoutButton';

export function AppSidebar({ onLogout }) {
  const { isSidebarCollapsed, language, toggleSidebar } = useLayoutStore();
  const { t } = useTranslation(['common', 'layout']);
  const isRtl = language === 'ar';
  const ToggleIcon = isSidebarCollapsed
    ? (isRtl ? PanelRightOpen : PanelLeftOpen)
    : (isRtl ? PanelRightClose : PanelLeftClose);
  const toggleLabel = isSidebarCollapsed
    ? t('layout:header.expandSidebar')
    : t('layout:header.collapseSidebar');

  return (
    <aside
      className={cn(
        'neo-sidebar sticky top-0 hidden h-screen shrink-0 border-e-2 bg-background/95 transition-all duration-300 lg:flex lg:flex-col',
        isSidebarCollapsed ? 'w-20' : 'w-72',
      )}
    >
      <div
        className={cn(
          'flex items-center border-b-2',
          isSidebarCollapsed ? 'h-24 flex-col justify-center gap-2 px-2' : 'h-16 justify-between gap-3 px-4',
        )}
      >
        {!isSidebarCollapsed && (
          <ThabatLogo size="sm" showWordmark showTagline />
        )}

        {isSidebarCollapsed && <ThabatLogo size="sm" />}

        <button
          type="button"
          onClick={toggleSidebar}
          title={toggleLabel}
          aria-label={toggleLabel}
          className="neo-nav-control inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-slate-300"
        >
          <ToggleIcon size={19} />
        </button>
      </div>

      <div className="sidebar-scrollbar flex-1 overflow-y-auto p-3">
        <AppSidebarNav items={appNavigation} collapsed={isSidebarCollapsed} />
      </div>

      <div className="space-y-1 border-t-2 p-3">
        <SidebarLogoutButton collapsed={isSidebarCollapsed} onLogout={onLogout} />
      </div>
    </aside>
  );
}
