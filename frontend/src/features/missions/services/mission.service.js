import { apiClient } from '@/services/api';

export const MissionService = {
  async summary() {
    const response = await apiClient.get('/missions/summary');
    return response.data.data;
  },

  async list(params = {}) {
    const response = await apiClient.get('/missions', { params });
    return {
      missions: response.data.data,
      pagination: response.data.meta?.pagination,
    };
  },

  async create(payload) {
    const response = await apiClient.post('/missions', payload);
    return response.data.data;
  },

  async update(id, payload) {
    const response = await apiClient.put(`/missions/${id}`, payload);
    return response.data.data;
  },

  async deactivate(id) {
    const response = await apiClient.delete(`/missions/${id}`);
    return response.data.data;
  },

  async assign(id, payload) {
    const response = await apiClient.post(`/missions/${id}/assign`, payload);
    return response.data.data;
  },

  async listAssignableUsers(params = {}) {
    const response = await apiClient.get('/missions/assignable-users', { params });
    return response.data.data;
  },

  async complete(id) {
    const response = await apiClient.post(`/missions/${id}/complete`);
    return response.data.data;
  },
};
