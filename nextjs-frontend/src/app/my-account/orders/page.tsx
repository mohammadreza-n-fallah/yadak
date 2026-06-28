'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  unpaid: 'text-yellow-600',
  paid: 'text-green-600',
  failed: 'text-red-600',
  refunded: 'text-gray-600',
};

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    cartApi.orders()
      .then(r => setOrders(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [_hasHydrated, isAuthenticated]);

  if (!_hasHydrated || loading) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">سفارش‌های من</h1>
        <Link href="/my-account" className="text-sm text-primary hover:underline flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
          </svg>
          بازگشت به حساب
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 card p-10">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-lg font-bold text-dark-2 mb-2">هیچ سفارشی ثبت نشده است</h2>
          <p className="text-muted mb-6">اولین خرید خود را از فروشگاه ما انجام دهید</p>
          <Link href="/shop" className="btn-primary px-8">شروع خرید</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="card p-5">
              {/* Header */}
              <div className="flex items-start justify-between flex-wrap gap-3 pb-3 border-b border-border-color mb-3">
                <div>
                  <div className="font-bold text-dark-2">سفارش #{order.order_number}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {new Date(order.created_at).toLocaleDateString('fa-IR', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${STATUS_COLORS[order.status] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                    {STATUS_LABELS[order.status] || order.status_display}
                  </span>
                  <span className={`text-xs font-medium ${PAYMENT_COLORS[order.payment_status] || 'text-gray-600'}`}>
                    {PAYMENT_LABELS[order.payment_status] || order.payment_status_display}
                  </span>
                </div>
              </div>

              {/* Items preview */}
              <div className="flex flex-wrap gap-2 mb-3">
                {order.items.map(item => (
                  <span key={item.id} className="text-xs bg-gray-100 text-dark-2 px-2 py-1 rounded-md">
                    {item.product_name} <span className="text-muted">× {item.quantity}</span>
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4">
                  <Link
                    href={`/my-account/orders/${order.order_number}`}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    جزئیات سفارش
                  </Link>
                  {order.tracking_code && (
                    <span className="text-xs text-muted">
                      کد رهگیری: <span className="font-mono text-dark-2">{order.tracking_code}</span>
                    </span>
                  )}
                </div>
                <span className="font-bold text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
