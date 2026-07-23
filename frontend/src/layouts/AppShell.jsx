import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppMobileDrawer } from '@/components/layout/AppMobileDrawer';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SpiritualVoiceReminders } from '@/components/SpiritualVoiceReminders';
import { AuthService } from '@/features/auth/services/auth.service';
import { applyLanguageAttributes } from '@/i18n';
import { useAuthStore } from '@/store/useAuthStore';
import { useLayoutStore } from '@/store/useLayoutStore';

export function AppShell() {
  const { isAuthenticated, logout, user, updateUser } = useAuthStore();
  const { language } = useLayoutStore();
  const location = useLocation();

  const { data, isError } = useQuery({
    queryKey: ['authMe'],
    queryFn: () => AuthService.me(),
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (data) updateUser(data);
  }, [data, updateUser]);

  useEffect(() => {
    if (isError) logout();
  }, [isError, logout]);

  useEffect(() => {
    applyLanguageAttributes(language);
  }, [language]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen [background:var(--gradient-background)] text-foreground">
      <div className="flex min-h-screen">
        <AppSidebar onLogout={logout} />
        <AppMobileDrawer onLogout={logout} />
        <SpiritualVoiceReminders enabled={isAuthenticated} />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader user={user} />

          <main className="app-neo flex-1 px-4 py-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
