import { apiClient } from '@/services/api';

export const GamificationService = {
  async getLevelInfo() {
    const response = await apiClient.get('/me/level');
    return response.data.data;
  },

  async getStreak() {
    const response = await apiClient.get('/me/streak');
    return response.data.data;
  },
};
