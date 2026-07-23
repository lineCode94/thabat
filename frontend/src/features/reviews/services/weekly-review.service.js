import { apiClient } from '@/services/api';

export const WeeklyReviewService = {
  listReviews: async (params = {}) => {
    const response = await apiClient.get('/reviews', { params });
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  },

  getReview: async (id) => {
    const response = await apiClient.get(`/reviews/${id}`);
    return response.data.data;
  },

  getCurrentReviewContext: async (userId) => {
    const response = await apiClient.get(`/users/${userId}/weekly-review/current`);
    return response.data.data;
  },

  initializeCurrentReview: async (userId) => {
    const response = await apiClient.post(`/users/${userId}/weekly-reviews`);
    return response.data.data;
  },

  updateReview: async (id, payload) => {
    const response = await apiClient.patch(`/weekly-reviews/${id}`, payload);
    return response.data.data;
  },

  completeReview: async (id) => {
    const response = await apiClient.post(`/weekly-reviews/${id}/complete`);
    return response.data.data;
  },
};
