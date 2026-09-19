import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ecom_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: extract response payload or error message
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Auto logout if token expired (avoid infinite loops on public routes)
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register') && currentPath !== '/') {
        localStorage.removeItem('ecom_token');
        localStorage.removeItem('ecom_user');
      }
    }
    const message =
      error.response?.data?.message || error.message || 'An unexpected network error occurred.';
    const enhancedError = new Error(message);
    enhancedError.response = error.response;
    enhancedError.code = error.response?.data?.code;
    return Promise.reject(enhancedError);
  }
);

export default api;
