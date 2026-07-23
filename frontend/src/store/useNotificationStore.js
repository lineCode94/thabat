import { create } from 'zustand';

import { NotificationService } from '@/features/notifications/services/notification.service';

export const useNotificationStore = create((set, get) => ({
  unreadCount: 0,
  unreadNotifications: [],
  isLoading: false,

  fetchUnread: async () => {
    set({ isLoading: true });
    try {
      const notifications = await NotificationService.getUnreadNotifications();
      set({ unreadNotifications: notifications, unreadCount: notifications.length });
    } catch (error) {
      console.error('Failed to fetch unread notifications', error);
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await NotificationService.markAsRead(id);
      const { unreadNotifications } = get();
      const updated = unreadNotifications.filter(n => n.id !== id);
      set({ unreadNotifications: updated, unreadCount: updated.length });
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await NotificationService.markAllAsRead();
      set({ unreadNotifications: [], unreadCount: 0 });
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  },
}));
