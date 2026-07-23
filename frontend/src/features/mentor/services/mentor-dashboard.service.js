import { apiClient } from '@/services/api';

export const MentorDashboardService = {
  async getDashboard() {
    const response = await apiClient.get('/mentor/dashboard');
    return response.data.data;
  },
};
