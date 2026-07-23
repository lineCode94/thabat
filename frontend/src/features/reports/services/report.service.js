import { apiClient } from '@/services/api';

export const ReportService = {
  async getDaily(params = {}) {
    const response = await apiClient.get('/reports/daily', { params });
    return response.data.data;
  },

  async getMonthly(params = {}) {
    const response = await apiClient.get('/reports/monthly', { params });
    return response.data.data;
  },
};
