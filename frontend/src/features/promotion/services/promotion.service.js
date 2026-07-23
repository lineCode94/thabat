import { apiClient } from '@/services/api';

export const PromotionService = {
  getReadiness: async (userId) => {
    const response = await apiClient.get(`/users/${userId}/promotion-readiness`);
    return response.data.data;
  },

  createRecommendation: async (userId, payload = {}) => {
    const response = await apiClient.post(`/users/${userId}/promotion-recommendations`, payload);
    return response.data.data;
  },

  listPromotions: async (params = {}) => {
    const response = await apiClient.get('/promotions', { params });
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  },

  getPromotion: async (id) => {
    const response = await apiClient.get(`/promotions/${id}`);
    return response.data.data;
  },

  approve: async (id) => {
    const response = await apiClient.post(`/promotions/${id}/approve`);
    return response.data.data;
  },

  decline: async (id, payload = {}) => {
    const response = await apiClient.post(`/promotions/${id}/decline`, payload);
    return response.data.data;
  },
};
