import api from './api';

export const productsService = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/admin/products', { params });
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, products: [], total: 0 };
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/admin/products/${id}`);
      return { success: true, product: response.data.product };
    } catch (error) {
      return { success: false };
    }
  },

  create: async (data) => {
    try {
      const response = await api.post('/admin/products', data);
      return { success: true, message: response.data.message, product: response.data.product };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/admin/products/${id}`, data);
      return { success: true, message: response.data.message, product: response.data.product };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/admin/products/${id}`);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },

  toggle: async (id) => {
    try {
      const response = await api.put(`/admin/products/${id}/toggle`);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },
};
