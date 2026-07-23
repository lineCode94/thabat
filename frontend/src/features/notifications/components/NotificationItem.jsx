import { formatDistanceToNow } from 'date-fns';
import { Calendar, CheckCircle2, Flag, Info, Settings, Shield, Trophy, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

const TYPE_CONFIG = {
  ACHIEVEMENT: {
    icon: Trophy,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
  },
  REMINDER: {
    icon: Calendar,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
  },
  WEEKLY_REMINDER: {
    icon: Calendar,
    color: 'text-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-800',
  },
  MENTOR: {
    icon: Users,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
  },
  ADMINISTRATIVE: {
    icon: Settings,
    color: 'text-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800',
  },
  BADGE: {
    icon: Shield,
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800',
  },
  MISSION_ASSIGNED: {
    icon: Flag,
    color: 'text-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800',
  },
  MISSION_COMPLETED: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
};

const DEFAULT_CONFIG = {
  icon: Info,
  color: 'text-slate-500',
  bg: 'bg-slate-50 dark:bg-slate-800/30',
  border: 'border-slate-200 dark:border-slate-700',
};

export function NotificationItem({ notification, onMarkRead, onOpenNotification }) {
  const { t } = useTranslation(['notifications']);
  const config = TYPE_CONFIG[notification.type] || DEFAULT_CONFIG;
  const Icon = config.icon;
  const isInteractive = Boolean(onOpenNotification);

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  const Component = isInteractive ? 'button' : 'div';

  return (
    <Component
      type={isInteractive ? 'button' : undefined}
      onClick={isInteractive ? () => onOpenNotification(notification) : undefined}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-start transition-all duration-200',
        isInteractive && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        config.bg,
        config.border,
        !notification.isRead && 'shadow-sm',
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
          config.bg,
        )}
      >
        <Icon size={16} className={config.color} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm font-medium leading-snug text-slate-800 dark:text-slate-100',
              !notification.isRead && 'font-semibold',
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onMarkRead(notification.id);
              }}
              className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5 hover:scale-125 transition-transform cursor-pointer"
              title={t('markAsRead')}
              aria-label={t('markAsRead')}
            />
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{timeAgo}</p>
      </div>
    </Component>
  );
}
