import { apiClient } from '@/services/api';

export const ProfileService = {
  async getProfile() {
    const response = await apiClient.get('/profile');
    return response.data.data;
  },

  async updateProfile(data) {
    const response = await apiClient.put('/profile', data);
    return {
      data: response.data.data,
      message: response.data.message,
    };
  },

  async changePassword(data) {
    const response = await apiClient.put('/profile/password', data);
    return {
      data: response.data.data,
      message: response.data.message,
    };
  }
};
