import { create } from 'zustand';
import { shopApi } from '@/lib/api';

interface WishlistStore {
  productIds: Set<number>;
  loaded: boolean;
  load: () => Promise<void>;
  toggle: (productId: number) => Promise<boolean>;
  isWishlisted: (productId: number) => boolean;
  reset: () => void;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  productIds: new Set(),
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    try {
      const { data } = await shopApi.wishlist();
      const ids = new Set<number>((data.products || []).map((p: { id: number }) => p.id));
      set({ productIds: ids, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  toggle: async (productId: number) => {
    try {
      const { data } = await shopApi.toggleWishlist(productId);
      const added = data.status === 'added';
      set(s => {
        const next = new Set(s.productIds);
        if (added) next.add(productId);
        else next.delete(productId);
        return { productIds: next };
      });
      return added;
    } catch {
      throw new Error('auth_required');
    }
  },

  isWishlisted: (productId: number) => get().productIds.has(productId),

  reset: () => set({ productIds: new Set(), loaded: false }),
}));
