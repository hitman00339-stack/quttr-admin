import api from './api';

export const noticesService = {
  getAll: async () => {
    try {
      const response = await api.get('/admin/notices');
      return { success: true, notices: response.data.notices || [] };
    } catch (error) {
      return { success: false, notices: [] };
    }
  },

  send: async (data) => {
    try {
      const response = await api.post('/admin/notices/send', data);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/admin/notices/${id}`);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },
};
