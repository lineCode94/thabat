import { apiClient } from '@/services/api';

export const AchievementService = {
  async getAll() {
    const response = await apiClient.get('/me/achievements');
    return response.data.data;
  },

  async getByKey(key) {
    const response = await apiClient.get(`/me/achievements/${key}`);
    return response.data.data;
  },

  async getProgress() {
    const response = await apiClient.get('/me/achievements/progress');
    return response.data.data;
  },

  async getRecent(limit = 3) {
    const response = await apiClient.get('/me/achievements/recent', { params: { limit } });
    return response.data.data;
  },
};
