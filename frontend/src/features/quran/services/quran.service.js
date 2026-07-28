import { apiClient } from '@/services/api';

export const QuranService = {
  async getProgress() {
    const response = await apiClient.get('/quran/progress');
    return response.data.data;
  },

  async setup(payload) {
    const response = await apiClient.post('/quran/setup', payload);
    return response.data.data;
  },

  async submitWeeklyLog(payload) {
    const response = await apiClient.post('/quran/weekly-log', payload);
    return response.data.data;
  },

  async updateWeeklyTarget(payload) {
    const response = await apiClient.patch('/quran/progress/target', payload);
    return response.data.data;
  },

  async updateTrack(payload) {
    const response = await apiClient.patch('/quran/progress/track', payload);
    return response.data.data;
  },

  async getHistory(params = {}) {
    const response = await apiClient.get('/quran/weekly-log/history', { params });
    return {
      logs: response.data.data?.logs ?? [],
      user: response.data.data?.user,
      pagination: response.data.meta?.pagination,
    };
  },
};
