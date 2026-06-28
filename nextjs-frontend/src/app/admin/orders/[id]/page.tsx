'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, formatPrice, mediaUrl } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface OrderItem { id: number; product_name: string; product_image: string | null; quantity: number; unit_price: number; subtotal: number; }
interface OrderDetail {
  id: number; order_number: string; shipping_full_name: string; shipping_phone: string;
  shipping_address: string; shipping_city: string; shipping_province: string; shipping_postal_code: string;
  total: number; subtotal: number; shipping_cost: number; discount_amount: number;
  status: string; payment_status: string; tracking_code: string; note: string;
  created_at: string; user_name: string; user_email: string; items: OrderItem[];
}

const STATUS_LABELS: Record<string, string> = { pending: 'در انتظار', paid: 'پرداخت شده', processing: 'پردازش', shipped: 'ارسال شده', delivered: 'تحویل', cancelled: 'لغو', refunded: 'مرجوع' };

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [tracking, setTracking] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    adminApi.order(Number(id)).then(r => {
      setOrder(r.data); setStatus(r.data.status); setTracking(r.data.tracking_code || ''); setNote(r.data.note || ''); setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.updateOrder(Number(id), { status, tracking_code: tracking, note });
      toast.success('سفارش بروزرسانی شد');
      router.push('/admin/orders');
    } catch { toast.error('خطا'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!order) return <p className="text-center py-20 text-gray-400">سفارش یافت نشد</p>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/admin/orders')} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="text-xl font-bold text-gray-800">سفارش {order.order_number}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-700 mb-3 text-sm">اقلام سفارش</h2>
            <div className="space-y-3">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product_image
                      ? <Image src={mediaUrl(item.product_image)} alt={item.product_name} width={48} height={48} className="object-contain" />
                      : <span className="flex items-center justify-center h-full text-gray-400 text-lg">🔧</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 text-sm line-clamp-1">{item.product_name}</div>
                    <div className="text-xs text-gray-400">{item.quantity} × {formatPrice(item.unit_price)}</div>
                  </div>
                  <div className="font-bold text-primary text-sm flex-shrink-0">{formatPrice(item.subtotal)}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600"><span>جمع:</span><span>{formatPrice(order.subtotal)}</span></div>
              {order.shipping_cost > 0 && <div className="flex justify-between text-sm text-gray-600"><span>ارسال:</span><span>{formatPrice(order.shipping_cost)}</span></div>}
              {order.discount_amount > 0 && <div className="flex justify-between text-sm text-green-600"><span>تخفیف:</span><span>-{formatPrice(order.discount_amount)}</span></div>}
              <div className="flex justify-between font-bold text-gray-800"><span>کل:</span><span className="text-primary">{formatPrice(order.total)}</span></div>
            </div>
          </div>

          {/* Update form */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-700 mb-3 text-sm">بروزرسانی سفارش</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">وضعیت</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">کد پیگیری ارسال</label>
                <input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="مثلاً: IR12345678"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-mono" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">یادداشت ادمین</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <button onClick={save} disabled={saving} className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-700 mb-3 text-sm">اطلاعات مشتری</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500 text-xs">نام:</span><div className="font-medium text-gray-800">{order.shipping_full_name}</div></div>
              <div><span className="text-gray-500 text-xs">ایمیل:</span><div className="text-gray-600">{order.user_email}</div></div>
              <div><span className="text-gray-500 text-xs">تلفن:</span><div className="text-gray-600">{order.shipping_phone}</div></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-700 mb-3 text-sm">آدرس ارسال</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <div>{order.shipping_province}، {order.shipping_city}</div>
              <div>{order.shipping_address}</div>
              <div>کد پستی: {order.shipping_postal_code}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-700 mb-3 text-sm">وضعیت پرداخت</h2>
            <div className={`text-sm font-medium ${order.payment_status === 'paid' ? 'text-green-600' : order.payment_status === 'failed' ? 'text-red-500' : 'text-yellow-600'}`}>
              {order.payment_status === 'paid' ? '✓ پرداخت شده' : order.payment_status === 'failed' ? '✗ ناموفق' : '⏳ در انتظار'}
            </div>
            <div className="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleString('fa-IR')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
