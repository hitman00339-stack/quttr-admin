import api from './api';

// ═══════════════════════════════════════════════════
// SHOP ANALYTICS SERVICE
// ═══════════════════════════════════════════════════
export const shopAnalyticsService = {
  // Get shop analytics data
  get: async (params = {}) => {
    try {
      const response = await api.get('/admin/shop-analytics', { params });
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false };
    }
  },

  // Get list of cities for filter
  getCities: async () => {
    try {
      const response = await api.get('/admin/shop-analytics/cities');
      return { success: true, cities: response.data.cities || [] };
    } catch (error) {
      return { success: false, cities: [] };
    }
  },

  // Get list of shops for filter
  getShopsList: async () => {
    try {
      const response = await api.get('/admin/shop-analytics/shops-list');
      return { success: true, shops: response.data.shops || [] };
    } catch (error) {
      return { success: false, shops: [] };
    }
  },
};

export default shopAnalyticsService;
