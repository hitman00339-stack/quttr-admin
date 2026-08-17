import api from './api';

export const staffService = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/admin/staff', { params });
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, staff: [], total: 0 };
    }
  },

  getPending: async () => {
    try {
      const response = await api.get('/admin/staff/pending');
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, staff: [] };
    }
  },

  approve: async (id) => {
    try {
      const response = await api.put(`/admin/staff/${id}/approve`);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },

  reject: async (id, reason) => {
    try {
      const response = await api.put(`/admin/staff/${id}/reject`, { reason });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/admin/staff/${id}`);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },
};
