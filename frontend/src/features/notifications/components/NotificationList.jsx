import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { NotificationItem } from './NotificationItem';

export function NotificationList({ notifications, onMarkRead, onOpenNotification, emptyMessage }) {
  const { t } = useTranslation(['notifications']);
  const fallbackEmptyMessage = emptyMessage ?? t('empty');

  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 dark:text-slate-500">
        <Bell size={32} className="mb-3 opacity-40" />
        <p className="text-sm font-medium">{fallbackEmptyMessage}</p>
        <p className="text-xs mt-1">{t('caughtUp')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkRead={onMarkRead}
          onOpenNotification={onOpenNotification}
        />
      ))}
    </div>
  );
}
