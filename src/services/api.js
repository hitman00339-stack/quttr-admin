import axios from 'axios';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════
// QUTTR ADMIN — API CLIENT
// ═══════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quttr-backend.onrender.com/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Token helpers ────────────────────────────
const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('quttr_admin_token');
};

export const setAuthToken = (token) => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('quttr_admin_token', token);
  } else {
    localStorage.removeItem('quttr_admin_token');
  }
};

export const getAdminData = () => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('quttr_admin_data');
  return data ? JSON.parse(data) : null;
};

export const setAdminData = (data) => {
  if (typeof window === 'undefined') return;
  if (data) {
    localStorage.setItem('quttr_admin_data', JSON.stringify(data));
  } else {
    localStorage.removeItem('quttr_admin_data');
  }
};

// ─── Request Interceptor ──────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isNetworkError = !error?.response;
    const message = error?.response?.data?.message || (isNetworkError ? 'Backend waking up (free tier) — please retry in 5s' : 'Something went wrong');
    const status = error?.response?.status;

    if (status === 401) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      if (currentPath !== '/login' && !currentPath.includes('/auth')) {
        setAuthToken(null);
        setAdminData(null);
        toast.error('Session expired. Please login again.');
        setTimeout(() => {
          if (typeof window !== 'undefined') window.location.href = '/login';
        }, 1000);
      }
    }

    // Don't duplicate toast on login send-otp since login page handles it explicitly
    const isAuthSendOtp = error?.config?.url?.includes('/admin/auth/send-otp');
    if (status !== 401 && !error?.config?.suppressToast && !isAuthSendOtp) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
