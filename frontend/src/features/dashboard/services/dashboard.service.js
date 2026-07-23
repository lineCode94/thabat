import { apiClient } from '@/services/api';

export const DashboardService = {
  async getSummary() {
    const response = await apiClient.get('/dashboard/summary');
    return response.data.data;
  }
};
