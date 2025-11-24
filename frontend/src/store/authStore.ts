import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  
  // Role helpers
  isClient: () => boolean;
  isOperator: () => boolean;
  isAdmin: () => boolean;
  hasRole: (role: UserRole) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),
      
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
      
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
      
      // Role helpers
      isClient: () => {
        const { user } = get();
        return user?.role === 'client';
      },
      
      isOperator: () => {
        const { user } = get();
        return user?.role === 'operator';
      },
      
      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
      },
      
      hasRole: (role) => {
        const { user } = get();
        return user?.role === role;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

