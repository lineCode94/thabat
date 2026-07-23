import { apiClient } from '@/services/api';

export const NotificationPreferenceService = {
  getPreferences: async () => {
    const response = await apiClient.get('/me/notification-preferences');
    return response.data.data;
  },

  updatePreferences: async (preferences) => {
    const response = await apiClient.put('/me/notification-preferences', preferences);
    return response.data.data;
  },
};
