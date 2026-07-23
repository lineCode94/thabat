import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ThabatLogo } from '@/components/branding/ThabatLogo';
import { useLayoutStore } from '@/store/useLayoutStore';

import { appNavigation } from './appNavigation';
import { AppSidebarNav } from './AppSidebarNav';
import { SidebarLogoutButton } from './SidebarLogoutButton';

export function AppMobileDrawer({ onLogout }) {
  const { isMobileSidebarOpen, closeMobileSidebar } = useLayoutStore();
  const { t } = useTranslation(['common', 'layout']);

  return (
    <AnimatePresence>
      {isMobileSidebarOpen && (
        <>
          <motion.button
            type="button"
            aria-label={t('layout:header.collapseSidebar')}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileSidebar}
          />
          <motion.aside
            className="neo-sidebar fixed inset-y-0 start-0 z-50 flex w-80 max-w-[86vw] flex-col border-e-2 bg-background lg:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex h-16 items-center justify-between border-b-2 px-4">
              <ThabatLogo size="sm" showWordmark showTagline />
              <button
                type="button"
                onClick={closeMobileSidebar}
                className="neo-nav-control rounded-xl p-2 text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-slate-300"
                aria-label={t('layout:header.collapseSidebar')}
              >
                <X size={20} />
              </button>
            </div>

            <div className="sidebar-scrollbar flex-1 overflow-y-auto p-3">
              <AppSidebarNav items={appNavigation} onNavigate={closeMobileSidebar} />
            </div>

            <div className="border-t-2 p-3">
              <SidebarLogoutButton onLogout={onLogout} onNavigate={closeMobileSidebar} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
