'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { shopApi, formatPrice, mediaUrl } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { Product } from '@/types';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

function WishlistCard({ product, onRemove }: { product: Product; onRemove: (id: number) => void }) {
  const { addItem } = useCartStore();
  const [removing, setRemoving] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await shopApi.toggleWishlist(product.id);
      onRemove(product.id);
      toast.success('از لیست علاقه‌مندی حذف شد');
    } catch {
      toast.error('خطا در حذف از لیست');
    } finally {
      setRemoving(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product.is_in_stock) return;
    setAdding(true);
    try {
      await addItem(product.id, 1);
      toast.success('به سبد خرید اضافه شد');
    } catch {
      toast.error('خطا در افزودن به سبد');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="card flex flex-col sm:flex-row gap-4 p-4 group hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <Link href={`/product/${product.slug}`} className="relative w-full sm:w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-b from-gray-50 to-white border border-border-color">
        <Image
          src={mediaUrl(product.main_image?.image)}
          alt={product.name}
          fill
          sizes="128px"
          className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
        />
        {!product.is_in_stock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-bold text-rose-500 bg-white px-2 py-0.5 rounded-full shadow-sm border border-rose-200">ناموجود</span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <Link href={`/product/${product.slug}`} className="font-semibold text-dark-2 hover:text-primary transition-colors line-clamp-2 text-sm leading-relaxed">
          {product.name}
        </Link>
        <div className="flex flex-wrap gap-3 text-xs text-muted">
          {product.part_number && (
            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">کد: {product.part_number}</span>
          )}
          {product.brand_name && (
            <span>برند: <span className="text-dark-2 font-medium">{product.brand_name}</span></span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          {product.sale_price ? (
            <>
              <span className="font-bold text-primary">{formatPrice(Number(product.sale_price))}</span>
              <span className="text-xs text-muted line-through">{formatPrice(Number(product.price))}</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                {product.discount_percent}٪
              </span>
            </>
          ) : (
            <span className="font-bold text-dark-2">{formatPrice(Number(product.price))}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          <button
            onClick={handleAddToCart}
            disabled={!product.is_in_stock || adding}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              product.is_in_stock
                ? 'bg-primary text-white hover:bg-primary-dark shadow-sm shadow-primary/20'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {adding ? 'در حال افزودن...' : product.is_in_stock ? 'افزودن به سبد خرید' : 'ناموجود'}
          </button>
          <button
            onClick={handleRemove}
            disabled={removing}
            title="حذف از علاقه‌مندی‌ها"
            className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-border-color hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500 transition-all text-muted disabled:opacity-50 flex-shrink-0"
          >
            {removing ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    shopApi.wishlist()
      .then(r => setProducts(r.data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [_hasHydrated, isAuthenticated]);

  const handleRemove = (productId: number) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  if (!_hasHydrated || loading) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark-2">
          علاقه‌مندی‌ها
          {products.length > 0 && (
            <span className="text-base font-normal text-muted mr-2">({products.length} محصول)</span>
          )}
        </h1>
        <Link href="/shop" className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1.5 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          ادامه خرید
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 card p-10">
          <div className="w-24 h-24 mx-auto bg-rose-50 rounded-full flex items-center justify-center mb-5">
            <svg className="w-12 h-12 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-dark-2 mb-2">لیست علاقه‌مندی‌های شما خالی است</h2>
          <p className="text-muted text-sm mb-8">محصولات مورد علاقه خود را با کلیک روی آیکون قلب ذخیره کنید</p>
          <Link href="/shop" className="btn-primary px-10 py-3 font-bold inline-block">رفتن به فروشگاه</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map(product => (
            <WishlistCard key={product.id} product={product} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
