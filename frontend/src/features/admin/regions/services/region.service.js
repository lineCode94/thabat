import { apiClient } from '@/services/api';

export const RegionService = {
  async list(params = {}) {
    const response = await apiClient.get('/regions', { params });
    return response.data.data;
  },

  async create(payload) {
    const response = await apiClient.post('/regions', payload);
    return response.data.data;
  },

  async update(id, payload) {
    const response = await apiClient.put(`/regions/${id}`, payload);
    return response.data.data;
  },

  async deactivate(id) {
    const response = await apiClient.delete(`/regions/${id}`);
    return response.data.data;
  },
};
