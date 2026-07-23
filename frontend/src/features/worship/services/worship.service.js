import { apiClient } from '@/services/api';

export const WorshipService = {
  async getCategories() {
    const response = await apiClient.get('/worship/categories');
    return response.data.data;
  },

  async getCategoryById(id) {
    const response = await apiClient.get(`/worship/categories/${id}`);
    return response.data.data;
  },

  async getItems(params = {}) {
    const response = await apiClient.get('/worship/items', { params });
    return response.data.data;
  },

  async getItemById(id) {
    const response = await apiClient.get(`/worship/items/${id}`);
    return response.data.data;
  },
};
