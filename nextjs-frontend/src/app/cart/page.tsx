'use client';
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { formatPrice, mediaUrl } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';

export default function CartPage() {
  const { cart, loading, fetchCart, setQuantity, removeItem, clearCart } = useCartStore();

  useEffect(() => { fetchCart(); }, []);

  if (loading && !cart) return <div className="flex justify-center py-20"><Spinner /></div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="w-28 h-28 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-14 h-14 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-dark-2 mb-2">سبد خرید شما خالی است</h1>
        <p className="text-muted mb-8 text-sm">محصولات موردنظر خود را از فروشگاه انتخاب و به سبد اضافه کنید</p>
        <Link href="/shop" className="btn-primary inline-block px-10 py-3 font-bold">رفتن به فروشگاه</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark-2">سبد خرید</h1>
        <button
          onClick={() => clearCart()}
          className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1.5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          پاک کردن سبد
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Items */}
        <div className="flex-1 space-y-3">
          {cart.items.map(item => (
            <div key={item.id} className="card p-4 flex gap-4 hover:shadow-md transition-shadow duration-200">
              <Link href={`/product/${item.product.slug}`} className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-border-color">
                {item.product.main_image
                  ? <Image src={mediaUrl(item.product.main_image.image)} alt={item.product.name} fill className="object-contain p-2" />
                  : (
                    <div className="flex items-center justify-center h-full text-gray-300">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      </svg>
                    </div>
                  )
                }
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/product/${item.product.slug}`} className="font-semibold text-dark-2 hover:text-primary text-sm line-clamp-2 leading-relaxed transition-colors">
                  {item.product.name}
                </Link>
                {item.product.part_number && (
                  <div className="text-xs text-muted mt-1 font-mono">کد: {item.product.part_number}</div>
                )}

                <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                  {/* Qty control */}
                  <div className="flex items-center border-2 border-border-color rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(item.product.id, item.quantity - 1)}
                      className="w-9 h-9 flex items-center justify-center text-lg font-light text-dark-2 hover:bg-gray-100 transition-colors"
                    >
                      −
                    </button>
                    <span className="w-9 h-9 flex items-center justify-center text-sm font-bold text-dark-2 border-x-2 border-border-color select-none tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(item.product.id, item.quantity + 1)}
                      className="w-9 h-9 flex items-center justify-center text-lg font-light text-dark-2 hover:bg-gray-100 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <div className="font-bold text-primary">{formatPrice(item.subtotal)}</div>
                    {item.quantity > 1 && (
                      <div className="text-xs text-muted">{formatPrice(item.product.effective_price)} × {item.quantity}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeItem(item.product.id)}
                title="حذف از سبد"
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all self-start mt-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}

          <Link href="/shop" className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark font-medium transition-colors py-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            ادامه خرید
          </Link>
        </div>

        {/* Summary */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="card p-5 sticky top-24 space-y-4">
            <h2 className="font-bold text-dark-2 text-base border-b border-border-color pb-3">خلاصه سفارش</h2>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-muted">
                <span>{cart.total_items} کالا در سبد</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">جمع کالاها</span>
                <span className="font-medium text-dark-2">{formatPrice(cart.total_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">هزینه ارسال</span>
                <span className="text-primary font-semibold">رایگان</span>
              </div>
            </div>

            <div className="border-t border-border-color pt-3">
              <div className="flex justify-between font-bold text-base">
                <span className="text-dark-2">مبلغ قابل پرداخت</span>
                <span className="text-primary">{formatPrice(cart.total_price)}</span>
              </div>
            </div>

            <Link href="/checkout" className="btn-primary w-full text-center block py-3.5 font-bold text-base">
              ادامه و پرداخت
            </Link>

            {/* Trust badges */}
            <div className="pt-2 flex items-center justify-center gap-4 text-xs text-muted border-t border-border-color">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                پرداخت امن
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                ارسال سریع
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
