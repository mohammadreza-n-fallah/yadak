'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types';
import { useWishlistStore } from '@/store/wishlist';
import { useCartStore } from '@/store/cart';

const safeStorage = createJSONStorage(() =>
  typeof window !== 'undefined' ? localStorage : {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }
);

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  login: (access: string, refresh: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      login: (access, refresh, user) => {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        set({ user, accessToken: access, refreshToken: refresh, isAuthenticated: true });
        useCartStore.getState().fetchCart(); // load this user's server cart
      },
      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        useWishlistStore.getState().reset();
        useCartStore.getState().reset(); // drop the previous user's cart badge
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-store',
      storage: safeStorage,
      onRehydrateStorage: () => (state) => {
        // Self-heal a desynced session: if we persisted "authenticated" but the
        // raw access token is gone (e.g. a failed refresh cleared it), drop back
        // to logged-out. Otherwise the app fires tokenless API calls that 401
        // with "Authentication credentials were not provided".
        if (state && state.isAuthenticated && typeof window !== 'undefined'
            && !localStorage.getItem('access_token')) {
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
        }
        state?.setHasHydrated(true);
      },
    }
  )
);
