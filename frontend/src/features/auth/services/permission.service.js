import { apiClient } from '@/services/api';

export const PermissionService = {
  async getMyPermissions() {
    const response = await apiClient.get('/me/permissions');
    return response.data.data;
  },
};
