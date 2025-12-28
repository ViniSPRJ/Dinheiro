import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from store (avoid circular dependency)
    const authData = localStorage.getItem('dinheiro-auth');
    if (authData) {
      try {
        const { state } = JSON.parse(authData);
        if (state.accessToken) {
          config.headers.Authorization = `Bearer ${state.accessToken}`;
        }
      } catch {
        // Ignore parse errors
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors and token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 - Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post('/auth/refresh-token');
        const { accessToken } = response.data.data;

        // Update token in localStorage
        const authData = localStorage.getItem('dinheiro-auth');
        if (authData) {
          const parsed = JSON.parse(authData);
          parsed.state.accessToken = accessToken;
          localStorage.setItem('dinheiro-auth', JSON.stringify(parsed));
        }

        processQueue();
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error);

        // Clear auth state and redirect to login
        localStorage.removeItem('dinheiro-auth');
        window.location.href = '/login';

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    const message = error.response?.data?.message || 'An error occurred';

    if (error.response?.status === 429) {
      toast.error('Too many requests. Please try again later.');
    } else if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.status !== 401) {
      // Don't show toast for 401 (handled by refresh)
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
