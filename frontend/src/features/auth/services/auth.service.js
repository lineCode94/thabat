import { apiClient } from '@/services/api';

export const AuthService = {
  async register(data) {
    const response = await apiClient.post('/auth/register', data);
    return response.data.data;
  },

  async login(data) {
    const response = await apiClient.post('/auth/login', data);
    return response.data.data;
  },

  async me() {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  },
};
