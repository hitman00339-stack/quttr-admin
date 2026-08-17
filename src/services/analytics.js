import api from './api';

export const analyticsService = {
  get: async (days = 30) => {
    try {
      const response = await api.get('/admin/analytics', { params: { days } });
      return { success: true, ...response.data.analytics };
    } catch (error) {
      return { success: false };
    }
  },
};
