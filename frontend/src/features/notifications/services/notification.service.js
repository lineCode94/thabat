import { apiClient } from '@/services/api';

export const NotificationService = {
  getNotifications: async (skip = 0, take = 50, filters = {}) => {
    const response = await apiClient.get('/me/notifications', { params: { skip, take, ...filters } });
    return response.data.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/me/notifications/stats');
    return response.data.data;
  },

  getUnreadNotifications: async () => {
    const response = await apiClient.get('/me/notifications/unread');
    return response.data.data;
  },

  markAsRead: async (id) => {
    const response = await apiClient.patch(`/me/notifications/${id}/read`);
    return response.data.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.patch('/me/notifications/read-all');
    return {
      data: response.data.data,
      message: response.data.message,
    };
  },
};
