'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { adminApi, formatPrice } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import { Suspense } from 'react';

interface Order {
  id: number; order_number: string; shipping_full_name: string;
  total: number; status: string; payment_status: string; created_at: string;
  user_name: string; user_email: string; items_count?: number;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار', paid: 'پرداخت شده', processing: 'پردازش',
  shipped: 'ارسال شده', delivered: 'تحویل', cancelled: 'لغو', refunded: 'مرجوع',
};
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', paid: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700', shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};
const PAYMENT_LABELS: Record<string, string> = { unpaid: 'پرداخت نشده', paid: 'پرداخت شده', failed: 'ناموفق', refunded: 'مرجوع' };
const PAYMENT_COLORS: Record<string, string> = { unpaid: 'text-yellow-600', paid: 'text-green-600', failed: 'text-red-500', refunded: 'text-gray-500' };

function OrdersContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = { page };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    try {
      const { data } = await adminApi.orders(params);
      setOrders(data.results || data);
      setCount(data.count || data.length);
    } finally { setLoading(false); }
  }, [search, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: number, status: string) => {
    try {
      await adminApi.updateOrder(id, { status });
      setOrders(os => os.map(o => o.id === id ? { ...o, status } : o));
      toast.success('وضعیت بروزرسانی شد');
    } catch { toast.error('خطا'); }
  };

  const totalPages = Math.ceil(count / 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">سفارش‌ها</h1>
          <p className="text-sm text-gray-500 mt-0.5">{count} سفارش</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-wrap gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="جستجو نام مشتری، شماره سفارش، تلفن..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary flex-1 min-w-48" />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
          <option value="">همه وضعیت‌ها</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <div className="flex justify-center py-16"><Spinner /></div> : orders.length === 0
          ? <div className="text-center py-16 text-gray-400">سفارشی یافت نشد</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-right">
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">#</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">مشتری</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">مبلغ</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">پرداخت</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">وضعیت</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">تاریخ</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">تغییر وضعیت</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{o.order_number}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800 text-sm">{o.shipping_full_name}</div>
                        <div className="text-gray-400 text-xs">{o.user_email}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-primary text-sm">{formatPrice(o.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${PAYMENT_COLORS[o.payment_status] || 'text-gray-600'}`}>{PAYMENT_LABELS[o.payment_status] || o.payment_status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[o.status] || o.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('fa-IR')}</td>
                      <td className="px-4 py-3">
                        <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                          className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-primary">
                          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${o.id}`} className="text-xs text-blue-600 hover:underline">جزئیات</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-1">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs ${page === p ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'}`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return <Suspense fallback={<Spinner />}><OrdersContent /></Suspense>;
}
