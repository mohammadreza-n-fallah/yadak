'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Product } from '@/types';
import { formatPrice, mediaUrl } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { useWishlistStore } from '@/store/wishlist';
import Rating from '@/components/ui/Rating';

const BADGE_MAP: Record<string, string> = {
  new: 'جدید',
  sale: 'حراج',
  original: 'اصلی',
  hot: 'پرفروش',
};
const BADGE_CLASS: Record<string, string> = {
  new: 'badge-new',
  sale: 'badge-sale',
  original: 'badge-original',
  hot: 'badge-hot',
};

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const wishlisted = useWishlistStore(s => s.productIds.has(product.id));
  const load = useWishlistStore(s => s.load);
  const toggle = useWishlistStore(s => s.toggle);
  const [adding, setAdding] = useState(false);
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
      await addItem(product.id, 1);
      toast.success('محصول به سبد خرید اضافه شد');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(msg || 'خطا در افزودن به سبد');
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('ابتدا وارد حساب خود شوید');
      return;
    }
    setToggling(true);
    try {
      const added = await toggle(product.id);
      toast.success(added ? 'به لیست علاقه‌مندی اضافه شد' : 'از لیست علاقه‌مندی حذف شد');
    } catch {
      toast.error('خطا در بروزرسانی لیست علاقه‌مندی');
    } finally {
      setToggling(false);
    }
  };

  const imgSrc = mediaUrl(product.main_image?.image);

  return (
    <div className="card group relative overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col">

      {/* Top badges */}
      <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1">
        {product.badge && BADGE_MAP[product.badge] && (
          <span className={BADGE_CLASS[product.badge]}>{BADGE_MAP[product.badge]}</span>
        )}
        {!product.is_in_stock && <span className="badge-out">ناموجود</span>}
        {product.discount_percent > 0 && (
          <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
            %{product.discount_percent}
          </span>
        )}
      </div>

      {/* Wishlist button */}
      <button
        onClick={handleWishlist}
        disabled={toggling}
        title="افزودن به علاقه‌مندی"
        className={`absolute top-2.5 left-2.5 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center transition-all duration-200 disabled:opacity-50 hover:scale-110 ${
          wishlisted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <svg
          className={`w-4 h-4 transition-colors duration-200 ${wishlisted ? 'fill-rose-500 text-rose-500' : 'fill-none stroke-gray-500'}`}
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      {/* Image */}
      <Link href={`/product/${product.slug}`} className="block relative overflow-hidden bg-gradient-to-b from-gray-50 to-white" style={{ paddingTop: '85%' }}>
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
        />
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-sm font-semibold text-dark-2 hover:text-primary transition-colors duration-150 line-clamp-2 min-h-[2.75rem] leading-relaxed">
            {product.name}
          </h3>
        </Link>

        {product.part_number && (
          <p className="text-[11px] text-muted mt-1 font-mono tracking-wide">
            {product.part_number}
          </p>
        )}

        <div className="mt-1.5">
          <Rating value={product.average_rating} count={product.review_count} />
        </div>

        <div className="mt-auto pt-3 flex flex-col gap-2.5 border-t border-gray-50 mt-3">
          {product.sale_price ? (
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-primary">{formatPrice(product.effective_price)}</span>
              <span className="text-xs text-muted line-through">{formatPrice(product.price)}</span>
            </div>
          ) : (
            <span className="text-base font-bold text-dark-2">{formatPrice(product.price)}</span>
          )}

          <button
            onClick={handleAddToCart}
            disabled={!product.is_in_stock || adding}
            className={`w-full py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 ${
              product.is_in_stock
                ? 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {!adding && product.is_in_stock && (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            )}
            {adding ? 'در حال افزودن...' : product.is_in_stock ? 'افزودن به سبد' : 'ناموجود'}
          </button>
        </div>
      </div>
    </div>
  );
}
