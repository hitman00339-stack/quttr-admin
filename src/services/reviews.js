import api from './api';

export const reviewsService = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/admin/reviews', { params });
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, reviews: [], total: 0 };
    }
  },

  toggleVisibility: async (id) => {
    try {
      const response = await api.put(`/admin/reviews/${id}/toggle-visibility`);
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/admin/reviews/${id}`);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },
};
