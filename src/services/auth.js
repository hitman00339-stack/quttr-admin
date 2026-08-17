import api, { setAuthToken, setAdminData, getAdminData } from './api';

// ═══════════════════════════════════════════════════
// QUTTR ADMIN — AUTHENTICATION SERVICE
// Uses /admin/auth/* endpoints (NOT /auth/*)
// ═══════════════════════════════════════════════════

export const authService = {
  // ─── Step 1: Send OTP to admin phone ─────────
  sendOTP: async (phone) => {
    try {
      const response = await api.post('/admin/auth/send-otp', { phone });
      return {
        success: true,
        message: response.data.message,
        devOTP: response.data.devOTP,
        expiresInMinutes: response.data.expiresInMinutes,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP',
      };
    }
  },

  // ─── Step 2: Verify OTP ──────────────────────
  verifyOTP: async (phone, otp) => {
    try {
      const response = await api.post('/admin/auth/verify-otp', {
        phone,
        otp,
      });
      return {
        success: true,
        message: response.data.message,
        nextStep: response.data.nextStep,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid OTP',
      };
    }
  },

  // ─── Step 3: Verify Password → Get JWT ─────
  login: async (phone, password) => {
    try {
      const response = await api.post('/admin/auth/login', {
        phone,
        password,
      });

      const { token, admin } = response.data;
      setAuthToken(token);
      setAdminData(admin);

      return {
        success: true,
        message: response.data.message,
        admin,
        token,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  },

  // ─── Verify current token ────────────────────
  verifyToken: async () => {
    try {
      const response = await api.get('/admin/auth/verify');
      return {
        success: true,
        valid: response.data.valid,
        admin: response.data.admin,
      };
    } catch (error) {
      setAuthToken(null);
      setAdminData(null);
      return { success: false, valid: false };
    }
  },

  // ─── Logout ──────────────────────────────────
  logout: async () => {
    try {
      await api.post('/admin/auth/logout');
    } catch (_) {}
    setAuthToken(null);
    setAdminData(null);
    window.location.href = '/login';
  },

  // ─── Check if authenticated ──────────────────
  isAuthenticated: () => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('quttr_admin_token');
    return !!token;
  },

  // ─── Get current admin ───────────────────────
  getCurrentAdmin: () => {
    return getAdminData();
  },
};

export default authService;
