import { apiClient } from '@/services/api';

export const AdminUserService = {
  async list(params = {}) {
    const response = await apiClient.get('/admin/users', { params });
    return {
      users: response.data.data,
      pagination: response.data.meta?.pagination,
    };
  },

  async getById(id) {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data.data;
  },

  async listRoles() {
    const response = await apiClient.get('/admin/users/roles');
    return response.data.data;
  },

  async create(payload) {
    const response = await apiClient.post('/admin/users', payload);
    return response.data.data;
  },

  async update(id, payload) {
    const response = await apiClient.put(`/admin/users/${id}`, payload);
    return response.data.data;
  },

  async deactivate(id) {
    const response = await apiClient.patch(`/admin/users/${id}/deactivate`);
    return response.data.data;
  },

  async reactivate(id) {
    const response = await apiClient.patch(`/admin/users/${id}/reactivate`);
    return response.data.data;
  },

  async transferRegion(id, payload) {
    const response = await apiClient.post(`/admin/users/${id}/transfer-region`, payload);
    return response.data.data;
  },
};
