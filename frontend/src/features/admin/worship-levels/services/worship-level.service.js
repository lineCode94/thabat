import { apiClient } from '@/services/api';

export const WorshipLevelService = {
  async list(params = {}) {
    const response = await apiClient.get('/worship-levels', { params });
    return response.data.data;
  },

  async create(data) {
    const response = await apiClient.post('/worship-levels', data);
    return response.data.data;
  },

  async update(id, data) {
    const response = await apiClient.put(`/worship-levels/${id}`, data);
    return response.data.data;
  },

  async deactivate(id) {
    const response = await apiClient.delete(`/worship-levels/${id}`);
    return response.data.data;
  },

  async listAssignableUsers(params = {}) {
    const response = await apiClient.get('/worship-levels/assignable-users', { params });
    return response.data.data;
  },

  async assignUsers(id, userIds) {
    const response = await apiClient.post(`/worship-levels/${id}/assign-users`, { userIds });
    return response.data.data;
  },

  async getUserCustomSchedule(userId) {
    const response = await apiClient.get(`/worship-levels/users/${userId}/custom-schedule`);
    return response.data.data;
  },

  async updateUserCustomSchedule(userId, data) {
    const response = await apiClient.put(`/worship-levels/users/${userId}/custom-schedule`, data);
    return response.data.data;
  },
};
