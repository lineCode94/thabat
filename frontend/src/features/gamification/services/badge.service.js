import { apiClient } from '@/services/api';

export const BadgeService = {
  async getAll() {
    const response = await apiClient.get('/me/badges');
    return response.data.data;
  },

  async getByKey(key) {
    const response = await apiClient.get(`/me/badges/${key}`);
    return response.data.data;
  },

  async getRecent(limit = 3) {
    const response = await apiClient.get('/me/badges/recent', { params: { limit } });
    return response.data.data;
  },
};
