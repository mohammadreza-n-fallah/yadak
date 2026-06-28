'use client';
import { create } from 'zustand';
import toast from 'react-hot-toast';
import { Cart } from '@/types';
import { cartApi } from '@/lib/api';

/** Pull the human-readable message the API returns ({error} or {detail}). */
const serverMessage = (e: unknown, fallback: string) => {
  const data = (e as { response?: { data?: { error?: string; detail?: string } } }).response?.data;
  return data?.error || data?.detail || fallback;
};

interface CartState {
  cart: Cart | null;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: number, delta?: number) => Promise<void>;
  setQuantity: (productId: number, qty: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  reset: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  loading: false,

  fetchCart: async () => {
    set({ loading: true });
    try {
      const { data } = await cartApi.get();
      set({ cart: data });
    } catch { /* unauthenticated / network — leave existing state untouched */ }
    finally { set({ loading: false }); }
  },

  // Increments the existing cart quantity by `delta` (default +1). Throws on
  // failure so the calling component (product card/detail) shows feedback.
  addItem: async (productId, delta = 1) => {
    // Make sure we know the current server quantity before computing the new
    // one, otherwise a stale (null) cart would overwrite a persisted quantity.
    let cart = get().cart;
    if (!cart) { await get().fetchCart(); cart = get().cart; }
    const existing = cart?.items.find(i => i.product.id === productId);
    const newQty = (existing?.quantity || 0) + delta;
    if (newQty < 1) {
      const { data } = await cartApi.remove(productId);
      set({ cart: data });
      return;
    }
    const { data } = await cartApi.add(productId, newQty);
    set({ cart: data });
  },

  // Sets an absolute quantity; removes when qty < 1. Self-contained error
  // handling because the cart page calls this fire-and-forget.
  setQuantity: async (productId, qty) => {
    try {
      if (qty < 1) {
        const { data } = await cartApi.remove(productId);
        set({ cart: data });
        return;
      }
      const { data } = await cartApi.add(productId, qty);
      set({ cart: data });
    } catch (e) {
      toast.error(serverMessage(e, 'بروزرسانی تعداد ناموفق بود'));
      await get().fetchCart(); // re-sync the UI with the server's truth
    }
  },

  removeItem: async (productId) => {
    try {
      const { data } = await cartApi.remove(productId);
      set({ cart: data });
    } catch (e) {
      toast.error(serverMessage(e, 'حذف از سبد ناموفق بود'));
      await get().fetchCart();
    }
  },

  clearCart: async () => {
    try {
      await cartApi.clear();
      set({ cart: null });
    } catch (e) {
      toast.error(serverMessage(e, 'پاک کردن سبد ناموفق بود'));
      await get().fetchCart();
    }
  },

  reset: () => set({ cart: null, loading: false }),
}));
