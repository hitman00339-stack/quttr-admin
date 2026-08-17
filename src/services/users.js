import api from './api';

export const usersService = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params });
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, users: [], total: 0 };
    }
  },

  getStats: async () => {
    try {
      const response = await api.get('/admin/users/stats');
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false };
    }
  },

  toggleStatus: async (id) => {
    try {
      const response = await api.put(`/admin/users/${id}/toggle-status`);
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },
};
