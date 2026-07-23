import { apiClient } from '@/services/api';

export const MentorAssignmentService = {
  async list(params = {}) {
    const response = await apiClient.get('/admin/mentor-assignments', { params });
    return response.data.data;
  },

  async assign(payload) {
    const response = await apiClient.post('/admin/mentor-assignments', payload);
    return response.data.data;
  },

  async transfer(userId, payload) {
    const response = await apiClient.post(`/admin/mentor-assignments/${userId}/transfer`, payload);
    return response.data.data;
  },

  async deactivate(id) {
    const response = await apiClient.post(`/admin/mentor-assignments/${id}/deactivate`);
    return response.data.data;
  },

  async listMentors(params = {}) {
    const response = await apiClient.get('/admin/mentors', { params });
    return response.data.data;
  },

  async getUserCurrentAssignment(userId) {
    const response = await apiClient.get(`/admin/users/${userId}/mentor-assignment`);
    return response.data.data;
  },

  async listMentorUsers(mentorId) {
    const response = await apiClient.get(`/admin/mentors/${mentorId}/users`);
    return response.data.data;
  },
};
