import { apiClient } from '@/services/api';

export const AdminPermissionService = {
  async list() {
    const response = await apiClient.get('/admin/permissions');
    return response.data.data;
  },

  async updateRolePermissions(roleId, permissions) {
    const response = await apiClient.put(`/admin/permissions/roles/${roleId}`, { permissions });
    return response.data.data;
  },
};
