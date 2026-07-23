import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { playNotificationSound } from '@/lib/soundEffects';
import { useNotificationStore } from '@/store/useNotificationStore';

import { NotificationService } from '../services/notification.service';

import { NotificationList } from './NotificationList';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const previousUnreadCountRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'notifications']);
  const { unreadCount, fetchUnread, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  useEffect(() => {
    const previousUnreadCount = previousUnreadCountRef.current;
    previousUnreadCountRef.current = unreadCount;

    if (previousUnreadCount === null) return;
    if (unreadCount > previousUnreadCount) {
      playNotificationSound();
    }
  }, [unreadCount]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => NotificationService.getNotifications(0, 20).then((d) => d.notifications),
    enabled: isOpen,
    staleTime: 30_000,
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id) => {
    await markAsRead(id);
    refetch();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    refetch();
  };

  const handleOpenNotification = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
    refetch();

    const route = notification.metadata?.route;
    if (route) {
      navigate(route);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className="neo-nav-control relative rounded-xl border-2 p-2 text-slate-500 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-slate-300"
        aria-label={t('notifications:open')}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -end-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold leading-none text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="notification-dropdown"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="neo-popover absolute end-0 top-full z-50 mt-3 flex max-h-[520px] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border-2 bg-card"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {t('notifications:title')}
                {unreadCount > 0 && (
                  <span className="ms-2 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
                    {t('notifications:unread', { count: unreadCount })}
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                  title={t('notifications:markAllAsReadTitle')}
                >
                  <CheckCheck size={14} />
                  {t('notifications:markAllAsRead')}
                </button>
              )}
            </div>

            <div className="app-scrollbar flex-1 overflow-y-auto p-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
                  <p className="text-sm font-medium text-red-500">{t('notifications:loadFailed')}</p>
                  <button onClick={() => refetch()} className="mt-1 text-xs text-primary hover:underline">
                    {t('common:actions.retry')}
                  </button>
                </div>
              ) : (
                <NotificationList
                  notifications={data}
                  onMarkRead={handleMarkRead}
                  onOpenNotification={handleOpenNotification}
                />
              )}
            </div>

            <div className="border-t border-slate-100 p-3 dark:border-slate-800">
              <Button type="button" variant="outline" className="w-full" onClick={handleViewAll}>
                {t('notifications:viewAll')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
