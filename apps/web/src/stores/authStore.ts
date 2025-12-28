import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  onboardingCompleted: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAccessToken: (accessToken) => set({ accessToken }),

      login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { user, accessToken } = response.data.data;

        set({
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      signup: async (email, password, name) => {
        const response = await api.post('/auth/signup', { email, password, name });
        const { user, accessToken } = response.data.data;

        set({
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          // Ignore logout errors
        } finally {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      refreshToken: async () => {
        try {
          const response = await api.post('/auth/refresh-token');
          const { accessToken } = response.data.data;

          set({ accessToken });
          return true;
        } catch {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });
          return false;
        }
      },

      checkAuth: async () => {
        const { accessToken } = get();

        if (!accessToken) {
          set({ isLoading: false });
          return;
        }

        try {
          const response = await api.get('/users/me');
          const { user } = response.data.data;

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          // Try to refresh token
          const refreshed = await get().refreshToken();

          if (refreshed) {
            await get().checkAuth();
          } else {
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        }
      },
    }),
    {
      name: 'dinheiro-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
      }),
    }
  )
);

// Initialize auth check on app load
if (typeof window !== 'undefined') {
  useAuthStore.getState().checkAuth();
}
