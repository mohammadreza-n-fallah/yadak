'use client';
import { useState } from 'react';
import Link from 'next/link';
import { cartApi, formatPrice } from '@/lib/api';
import { Order } from '@/types';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['pending', 'paid', 'processing', 'shipped', 'delivered'];

const STEP_LABELS: Record<string, string> = {
  pending: 'ثبت سفارش',
  paid: 'پرداخت',
  processing: 'آماده‌سازی',
  shipped: 'ارسال',
  delivered: 'تحویل',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار پرداخت',
  paid: 'پرداخت شده',
  processing: 'در حال پردازش',
  shipped: 'ارسال شده',
  delivered: 'تحویل داده شده',
  cancelled: 'لغو شده',
  refunded: 'مسترد شده',
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: 'پرداخت نشده',
  paid: 'پرداخت شده',
  failed: 'پرداخت ناموفق',
  refunded: 'مسترد',
};

export default function TrackOrderPage() {
  const [orderNum, setOrderNum] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setOrder(null);
    try {
      const { data } = await cartApi.track(orderNum.trim(), phone.trim());
      setOrder(data);
      setSearched(true);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 404) {
        toast.error('سفارشی با این مشخصات یافت نشد');
      } else {
        toast.error('خطا در پیگیری سفارش. لطفاً دوباره تلاش کنید');
      }
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : -1;
  const isCancelled = order?.status === 'cancelled' || order?.status === 'refunded';

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <h1 className="page-title mb-2 text-center">پیگیری سفارش</h1>
      <p className="text-muted text-sm text-center mb-8">
        شماره سفارش و شماره موبایل گیرنده را وارد کنید
      </p>

      {/* Search form */}
      <form onSubmit={handleTrack} className="card p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-2 mb-1">شماره سفارش</label>
            <input
              value={orderNum}
              onChange={e => setOrderNum(e.target.value)}
              required
              placeholder="مثلاً RP123456"
              className="input-field w-full"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-2 mb-1">شماره موبایل گیرنده</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              type="tel"
              placeholder="09xxxxxxxxx"
              className="input-field w-full"
              dir="ltr"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-4 w-full py-3 font-bold flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              در حال جستجو...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              پیگیری سفارش
            </>
          )}
        </button>
      </form>

      {/* Result */}
      {order && (
        <div className="card p-6 space-y-6">
          {/* Order header */}
          <div className="flex items-start justify-between flex-wrap gap-3 pb-4 border-b border-border-color">
            <div>
              <h2 className="font-bold text-dark-2 text-lg">سفارش #{order.order_number}</h2>
              <p className="text-sm text-muted mt-0.5">
                {new Date(order.created_at).toLocaleDateString('fa-IR', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
            <div className="text-left">
              <div className="font-bold text-primary text-lg">{formatPrice(order.total)}</div>
              <div className="text-xs text-muted mt-0.5">
                {PAYMENT_LABELS[order.payment_status] || order.payment_status_display}
              </div>
            </div>
          </div>

          {/* Status display */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-dark-2">وضعیت سفارش:</span>
              <span className={`text-sm font-bold ${isCancelled ? 'text-red-500' : 'text-primary'}`}>
                {STATUS_LABELS[order.status] || order.status_display}
              </span>
            </div>

            {/* Timeline */}
            {!isCancelled ? (
              <div className="flex items-start gap-0">
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={step} className="flex-1 flex flex-col items-center">
                      <div className="flex items-center w-full">
                        {i > 0 && (
                          <div className={`flex-1 h-1 rounded transition-all ${i <= currentStep ? 'bg-primary' : 'bg-gray-200'}`} />
                        )}
                        <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                          done
                            ? 'bg-primary border-primary text-white'
                            : 'bg-white border-gray-300 text-gray-400'
                        } ${active ? 'ring-4 ring-primary/20' : ''}`}>
                          {done && !active ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                            </svg>
                          ) : i + 1}
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`flex-1 h-1 rounded transition-all ${i < currentStep ? 'bg-primary' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      <span className={`text-[10px] mt-2 text-center leading-tight ${done ? 'text-primary font-semibold' : 'text-muted'}`}>
                        {STEP_LABELS[step]}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
                <span className="font-semibold text-red-700">
                  {order.status === 'cancelled' ? 'این سفارش لغو شده است' : 'این سفارش مسترد شده است'}
                </span>
              </div>
            )}
          </div>

          {/* Tracking code */}
          {order.tracking_code && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <div>
                <div className="text-xs text-muted">کد رهگیری مرسوله پستی</div>
                <div className="font-mono font-bold text-dark-2">{order.tracking_code}</div>
              </div>
            </div>
          )}

          {/* Shipping address */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
            <div className="font-semibold text-dark-2 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              آدرس تحویل
            </div>
            <div className="text-muted">گیرنده: <span className="text-dark-2">{order.shipping_full_name}</span></div>
            <div className="text-muted">
              {order.shipping_province}، {order.shipping_city}، {order.shipping_address}
            </div>
            <div className="text-muted">کد پستی: <span className="font-mono text-dark-2">{order.shipping_postal_code}</span></div>
          </div>

          {/* Items */}
          <div>
            <h3 className="font-semibold text-sm text-dark-2 mb-3">اقلام سفارش</h3>
            <div className="space-y-2">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm py-2 border-b border-border-color last:border-0">
                  <div>
                    <span className="text-dark-2 font-medium">{item.product_name}</span>
                    {item.product_part_number && (
                      <span className="text-xs text-muted mr-2">({item.product_part_number})</span>
                    )}
                    <span className="text-muted"> × {item.quantity}</span>
                  </div>
                  <span className="font-bold text-dark-2 whitespace-nowrap">{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>
            {/* Total */}
            <div className="flex justify-between font-bold text-base mt-3 pt-3 border-t border-border-color">
              <span className="text-dark-2">مبلغ کل</span>
              <span className="text-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      )}

      {searched && !order && !loading && (
        <div className="text-center py-10 card p-8">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-dark-2 font-semibold mb-1">سفارشی یافت نشد</p>
          <p className="text-muted text-sm">شماره سفارش یا شماره موبایل را بررسی کنید</p>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-muted">
        برای پشتیبانی بیشتر با ما{' '}
        <Link href="/contact" className="text-primary hover:underline">تماس بگیرید</Link>
      </div>
    </div>
  );
}
