'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { cartApi, formatPrice } from '@/lib/api';
import { Order } from '@/types';
import { useAuthStore } from '@/store/auth';
import Spinner from '@/components/ui/Spinner';

const STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار پرداخت',
  paid: 'پرداخت شده',
  processing: 'در حال پردازش',
  shipped: 'ارسال شده',
  delivered: 'تحویل داده شده',
  cancelled: 'لغو شده',
  refunded: 'مسترد شده',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  paid: 'text-blue-700 bg-blue-50 border-blue-200',
  processing: 'text-purple-700 bg-purple-50 border-purple-200',
  shipped: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  delivered: 'text-green-700 bg-green-50 border-green-200',
  cancelled: 'text-red-700 bg-red-50 border-red-200',
  refunded: 'text-gray-700 bg-gray-50 border-gray-200',
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: 'پرداخت نشده',
  paid: 'پرداخت شده',
  failed: 'پرداخت ناموفق',
  refunded: 'مسترد',
};

const PAYMENT_COLORS: Record<string, string> = {
  unpaid: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  paid: 'text-green-700 bg-green-50 border-green-200',
  failed: 'text-red-700 bg-red-50 border-red-200',
  refunded: 'text-gray-700 bg-gray-50 border-gray-200',
};

// Order timeline steps
const STATUS_STEPS = ['pending', 'paid', 'processing', 'shipped', 'delivered'];

export default function OrderDetailPage() {
  const router = useRouter();
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    cartApi.order(orderNumber)
      .then(r => setOrder(r.data))
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [_hasHydrated, isAuthenticated, orderNumber]);

  if (!_hasHydrated || loading) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  if (notFound || !order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-dark-2 mb-2">سفارش یافت نشد</h1>
        <Link href="/my-account/orders" className="btn-primary mt-4 inline-block px-6">بازگشت به سفارش‌ها</Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted mb-6 flex items-center gap-2">
        <Link href="/my-account" className="hover:text-primary">حساب کاربری</Link>
        <span>/</span>
        <Link href="/my-account/orders" className="hover:text-primary">سفارش‌ها</Link>
        <span>/</span>
        <span className="text-dark-2 font-medium">#{order.order_number}</span>
      </nav>

      {/* Header */}
      <div className="card p-5 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-dark-2">سفارش #{order.order_number}</h1>
            <p className="text-sm text-muted mt-1">
              تاریخ ثبت: {new Date(order.created_at).toLocaleDateString('fa-IR', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium border ${STATUS_COLORS[order.status] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
              {STATUS_LABELS[order.status] || order.status_display}
            </span>
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium border ${PAYMENT_COLORS[order.payment_status] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
              {PAYMENT_LABELS[order.payment_status] || order.payment_status_display}
            </span>
          </div>
        </div>

        {/* Tracking code */}
        {order.tracking_code && (
          <div className="mt-3 pt-3 border-t border-border-color">
            <span className="text-sm text-muted">کد رهگیری پست: </span>
            <span className="font-mono font-bold text-dark-2">{order.tracking_code}</span>
          </div>
        )}
      </div>

      {/* Status timeline */}
      {!['cancelled', 'refunded'].includes(order.status) && (
        <div className="card p-5 mb-4">
          <h2 className="font-bold text-dark-2 text-sm mb-4">پیگیری وضعیت سفارش</h2>
          <div className="flex items-center gap-0">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStepIndex;
              const active = i === currentStepIndex;
              const stepLabels: Record<string, string> = {
                pending: 'ثبت سفارش', paid: 'پرداخت', processing: 'پردازش', shipped: 'ارسال', delivered: 'تحویل',
              };
              return (
                <div key={step} className="flex-1 flex flex-col items-center">
                  <div className="flex items-center w-full">
                    {i > 0 && <div className={`flex-1 h-0.5 ${done ? 'bg-primary' : 'bg-gray-200'}`} />}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                      done ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                    } ${active ? 'ring-2 ring-primary/30 ring-offset-2' : ''}`}>
                      {done && !active ? '✓' : i + 1}
                    </div>
                    {i < STATUS_STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < currentStepIndex ? 'bg-primary' : 'bg-gray-200'}`} />}
                  </div>
                  <span className={`text-[10px] mt-1.5 text-center whitespace-nowrap ${done ? 'text-primary font-medium' : 'text-gray-400'}`}>
                    {stepLabels[step]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order items */}
      <div className="card p-5 mb-4">
        <h2 className="font-bold text-dark-2 text-sm mb-4">اقلام سفارش</h2>
        <div className="space-y-3">
          {order.items.map(item => (
            <div key={item.id} className="flex items-center gap-4 pb-3 border-b border-border-color last:border-0 last:pb-0">
              <div className="flex-1">
                <div className="font-medium text-dark-2 text-sm">{item.product_name}</div>
                {item.product_part_number && (
                  <div className="text-xs text-muted mt-0.5">شماره قطعه: {item.product_part_number}</div>
                )}
              </div>
              <div className="text-sm text-muted whitespace-nowrap">
                {formatPrice(item.unit_price)} × {item.quantity}
              </div>
              <div className="font-bold text-dark-2 text-sm whitespace-nowrap">
                {formatPrice(item.subtotal)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing summary + Shipping side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Shipping info */}
        <div className="card p-5">
          <h2 className="font-bold text-dark-2 text-sm mb-3">اطلاعات ارسال</h2>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-muted w-24 flex-shrink-0">گیرنده:</span>
              <span className="text-dark-2 font-medium">{order.shipping_full_name}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted w-24 flex-shrink-0">موبایل:</span>
              <span className="text-dark-2 font-mono">{order.shipping_phone}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted w-24 flex-shrink-0">استان / شهر:</span>
              <span className="text-dark-2">{order.shipping_province}، {order.shipping_city}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted w-24 flex-shrink-0">آدرس:</span>
              <span className="text-dark-2 leading-relaxed">{order.shipping_address}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted w-24 flex-shrink-0">کد پستی:</span>
              <span className="text-dark-2 font-mono">{order.shipping_postal_code}</span>
            </div>
            {order.note && (
              <div className="flex gap-2">
                <span className="text-muted w-24 flex-shrink-0">یادداشت:</span>
                <span className="text-dark-2">{order.note}</span>
              </div>
            )}
          </div>
        </div>

        {/* Price breakdown */}
        <div className="card p-5">
          <h2 className="font-bold text-dark-2 text-sm mb-3">خلاصه مبالغ</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">جمع کالاها</span>
              <span className="font-medium">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">هزینه ارسال</span>
              <span className={order.shipping_cost === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                {order.shipping_cost === 0 ? 'رایگان' : formatPrice(order.shipping_cost)}
              </span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>تخفیف</span>
                <span>- {formatPrice(order.discount_amount)}</span>
              </div>
            )}
            <hr />
            <div className="flex justify-between font-bold text-base">
              <span>مبلغ کل</span>
              <span className="text-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Link href="/my-account/orders" className="btn-outline px-5 py-2 text-sm">
          بازگشت به سفارش‌ها
        </Link>
        {order.status === 'delivered' && (
          <Link href="/shop" className="btn-primary px-5 py-2 text-sm">
            خرید مجدد
          </Link>
        )}
      </div>
    </div>
  );
}
