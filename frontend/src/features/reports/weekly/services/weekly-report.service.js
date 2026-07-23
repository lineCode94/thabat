import { apiClient } from '@/services/api';

export const WeeklyReportService = {
  async getWeekly(params = {}) {
    const response = await apiClient.get('/reports/weekly', { params });
    return response.data.data;
  },
};
