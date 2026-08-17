import api from './api';

export const approvalsService = {
  getAll: async () => {
    try {
      const response = await api.get('/admin/approvals/all');
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, counts: { total: 0 }, data: {} };
    }
  },

  getShopFull: async (id) => {
    try {
      const response = await api.get(`/admin/shops/${id}/full`);
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false };
    }
  },

  getUserFull: async (id) => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false };
    }
  },
};
