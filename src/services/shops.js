import api from './api';

export const shopsService = {
  // Get all shops
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/admin/shops', { params });
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, shops: [], total: 0 };
    }
  },

  // Get pending locations
  getPendingLocations: async () => {
    try {
      const response = await api.get('/admin/shops/pending-locations');
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, shops: [] };
    }
  },

  // Get pending services
  getPendingServices: async () => {
    try {
      const response = await api.get('/admin/shops/pending-services');
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, services: [] };
    }
  },

  // Get single shop
  getById: async (id) => {
    try {
      const response = await api.get(`/admin/shops/${id}`);
      return { success: true, shop: response.data.shop };
    } catch (error) {
      return { success: false };
    }
  },

  // Approve location
  approveLocation: async (id) => {
    try {
      const response = await api.put(`/admin/shops/${id}/approve-location`);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },

  // Reject location
  rejectLocation: async (id, reason) => {
    try {
      const response = await api.put(`/admin/shops/${id}/reject-location`, { reason });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },

  // Approve service
  approveService: async (shopId, serviceId) => {
    try {
      const response = await api.put(`/admin/shops/${shopId}/services/${serviceId}/approve`);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },

  // Reject service
  rejectService: async (shopId, serviceId, reason) => {
    try {
      const response = await api.put(`/admin/shops/${shopId}/services/${serviceId}/reject`, { reason });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },

  // Suspend
  suspend: async (id, reason) => {
    try {
      const response = await api.put(`/admin/shops/${id}/suspend`, { reason });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },

  // Terminate
  terminate: async (id, reason) => {
    try {
      const response = await api.put(`/admin/shops/${id}/terminate`, { reason });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },

  // Reactivate
  reactivate: async (id) => {
    try {
      const response = await api.put(`/admin/shops/${id}/reactivate`);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },

  // Delete
  delete: async (id) => {
    try {
      const response = await api.delete(`/admin/shops/${id}`);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },
};
