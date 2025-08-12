import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authRepository, type User } from '../repositories/authRepository';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  getProfile: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  
  // Initialize from storage
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await authRepository.login({ email, password });
          
          if (result.success && result.data) {
            const { user, token } = result.data;
            
            // Store token in localStorage
            localStorage.setItem('auth_token', token);
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            
            return true;
          } else {
            set({
              error: result.error || 'Login failed',
              isLoading: false
            });
            return false;
          }
        } catch (error) {
          set({
            error: 'Network error during login',
            isLoading: false
          });
          return false;
        }
      },

      register: async (name: string, email: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await authRepository.register({ name, email, password });
          
          if (result.success && result.data) {
            const { user, token } = result.data;
            
            // Store token in localStorage
            localStorage.setItem('auth_token', token);
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            
            return true;
          } else {
            set({
              error: result.error || 'Registration failed',
              isLoading: false
            });
            return false;
          }
        } catch (error) {
          set({
            error: 'Network error during registration',
            isLoading: false
          });
          return false;
        }
      },

      logout: async (): Promise<void> => {
        set({ isLoading: true });
        
        try {
          await authRepository.logout();
        } catch (error) {
          console.error('Logout error:', error);
        }
        
        // Clear localStorage
        localStorage.removeItem('auth_token');
        
        // Clear state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      },

      getProfile: async (): Promise<void> => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true });
        
        try {
          const result = await authRepository.getProfile();
          
          if (result.success && result.data) {
            set({
              user: result.data.user,
              isLoading: false,
              error: null
            });
          } else {
            // Invalid token, logout
            await get().logout();
          }
        } catch (error) {
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
      
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      initialize: async (): Promise<void> => {
        const token = localStorage.getItem('auth_token');
        
        if (token) {
          set({ token });
          
          // Validate token by getting profile
          await get().getProfile();
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);