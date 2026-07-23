import { apiClient } from '@/services/api';

export const TrackingService = {
  async getToday() {
    const response = await apiClient.get('/tracking/today');
    return response.data.data;
  },

  async getHistory(params = {}) {
    const response = await apiClient.get('/tracking/history', { params });
    return response.data.data;
  },

  async submitToday(data) {
    const response = await apiClient.post('/tracking/today', data);
    return {
      data: response.data.data,
      message: response.data.message,
    };
  },

  async getWorshipItems() {
    const response = await apiClient.get('/worship/items');
    return response.data.data;
  },

  async getCustomSchedule() {
    const response = await apiClient.get('/tracking/custom-schedule');
    return response.data.data;
  },

  async updateCustomSchedule(data) {
    const response = await apiClient.put('/tracking/custom-schedule', data);
    return response.data.data;
  },

  async createCustomWorshipItem(data) {
    const response = await apiClient.post('/tracking/custom-items', data);
    return response.data.data;
  }
};
