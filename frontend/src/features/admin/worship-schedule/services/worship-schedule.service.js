import { apiClient } from '@/services/api';

export const WorshipScheduleService = {
  async listCategories() {
    const response = await apiClient.get('/worship/categories', { params: { all: true } });
    return response.data.data;
  },

  async createCategory(data) {
    const response = await apiClient.post('/worship/categories', data);
    return response.data.data;
  },

  async listItems() {
    const response = await apiClient.get('/worship/items', { params: { all: true } });
    return response.data.data;
  },

  async createItem(data) {
    const response = await apiClient.post('/worship/items', data);
    return response.data.data;
  },

  async updateItem(id, data) {
    const response = await apiClient.put(`/worship/items/${id}`, data);
    return response.data.data;
  },

  async deactivateItem(id) {
    const response = await apiClient.delete(`/worship/items/${id}`);
    return response.data.data;
  },

  async setDailySchedule(id, isRequired) {
    const response = await apiClient.patch(`/worship/items/${id}/default-level-requirement`, {
      isRequired,
    });
    return response.data.data;
  },
};
