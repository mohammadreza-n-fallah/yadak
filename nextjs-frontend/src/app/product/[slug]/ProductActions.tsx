'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { useWishlistStore } from '@/store/wishlist';
import { Product } from '@/types';
import toast from 'react-hot-toast';

export default function ProductActions({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const wishlisted = useWishlistStore(s => s.productIds.has(product.id));
  const load = useWishlistStore(s => s.load);
  const toggle = useWishlistStore(s => s.toggle);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated]);

  const handleAddToCart = async () => {
    if (!product.is_in_stock) return;
    if (!isAuthenticated) {
      toast.error('برای افزودن به سبد ابتدا وارد شوید');
      router.push('/login');
      return;
    }
    setAdding(true);
    try {
      await addItem(product.id, qty);
      setAdded(true);
      toast.success('محصول به سبد خرید اضافه شد');
      setTimeout(() => setAdded(false), 4000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(msg || 'خطا در افزودن به سبد خرید');
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('برای افزودن به علاقه‌مندی‌ها ابتدا وارد شوید'); return; }
    setToggling(true);
    try {
      const wasAdded = await toggle(product.id);
      toast.success(wasAdded ? 'به لیست علاقه‌مندی اضافه شد' : 'از لیست علاقه‌مندی حذف شد');
    } catch {
      toast.error('خطا در بروزرسانی لیست علاقه‌مندی');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-4">
      {product.is_in_stock ? (
        <>
          {/* Qty stepper */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-dark-2 shrink-0">تعداد:</label>
            <div className="flex items-center border-2 border-border-color rounded-xl overflow-hidden">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="w-11 h-11 flex items-center justify-center text-xl font-light text-dark-2 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                −
              </button>
              <span className="w-12 text-center text-base font-bold text-dark-2 border-x-2 border-border-color select-none tabular-nums py-2.5">
                {qty}
              </span>
              <button
                onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))}
                className="w-11 h-11 flex items-center justify-center text-xl font-light text-dark-2 hover:bg-gray-100 transition-colors"
              >
                +
              </button>
            </div>
            {product.stock > 0 && product.stock <= 10 && (
              <span className="text-xs text-orange-600 font-medium">تنها {product.stock} عدد باقی‌مانده</span>
            )}
          </div>

          {/* CTA buttons */}
          {added ? (
            <div className="flex gap-3">
              <Link
                href="/cart"
                className="flex-1 btn-primary py-3.5 text-center font-bold flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                مشاهده سبد خرید
              </Link>
              <button onClick={handleAddToCart} className="btn-outline px-4 py-3.5 text-sm font-semibold">
                افزودن مجدد
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="w-full btn-primary py-3.5 font-bold text-base flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {adding ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  در حال افزودن...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  افزودن به سبد خرید
                </>
              )}
            </button>
          )}
        </>
      ) : (
        <div className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-400 font-bold text-center border border-gray-200">
          ناموجود
        </div>
      )}

      {/* Wishlist */}
      <button
        onClick={handleWishlist}
        disabled={toggling}
        className={`w-full py-3 rounded-xl border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 ${
          wishlisted
            ? 'border-rose-300 text-rose-500 bg-rose-50 hover:bg-rose-100'
            : 'border-border-color text-dark-2 hover:border-primary hover:text-primary hover:bg-primary/5'
        }`}
      >
        <svg
          className={`w-5 h-5 transition-all duration-200 ${wishlisted ? 'fill-rose-500 stroke-rose-500' : 'fill-none stroke-current'}`}
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {wishlisted ? 'در لیست علاقه‌مندی' : 'افزودن به علاقه‌مندی'}
      </button>
    </div>
  );
}
