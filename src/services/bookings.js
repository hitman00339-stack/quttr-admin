import api from './api';

export const bookingsService = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/admin/bookings', { params });
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, bookings: [], total: 0 };
    }
  },

  getByShop: async (shopId, params = {}) => {
    try {
      const response = await api.get(`/admin/bookings/shop/${shopId}`, { params });
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, bookings: [] };
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/admin/bookings/${id}`);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },
};
