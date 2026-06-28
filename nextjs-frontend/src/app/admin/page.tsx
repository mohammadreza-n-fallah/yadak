'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi, formatPrice } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';

interface Stats {
  total_orders: number; total_revenue: number; total_products: number; total_users: number;
  month_orders: number; month_revenue: number; revenue_growth: number;
  low_stock_count: number; pending_orders: number;
  daily_revenue: { date: string; revenue: number }[];
  status_counts: Record<string, number>;
  recent_orders: RecentOrder[];
}
interface RecentOrder {
  id: number; order_number: string; shipping_full_name: string; total: number;
  status: string; payment_status: string; created_at: string;
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

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

function MiniBar({ data }: { data: { date: string; revenue: number }[] }) {
  const max = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-primary/80 rounded-t"
            style={{ height: `${Math.max(4, (d.revenue / max) * 52)}px` }}
            title={`${d.date}: ${formatPrice(d.revenue)}`}
          />
          <span className="text-[9px] text-gray-400">{d.date}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.stats().then(r => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!stats) return <p className="text-center text-gray-500 py-20">خطا در بارگذاری آمار</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">داشبورد</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="کل درآمد" value={formatPrice(stats.total_revenue)} sub={`این ماه: ${formatPrice(stats.month_revenue)}`} color="bg-green-100" icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} />
        <StatCard label="کل سفارش‌ها" value={stats.total_orders.toLocaleString('fa-IR')} sub={`این ماه: ${stats.month_orders}`} color="bg-blue-100" icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>} />
        <StatCard label="محصولات فعال" value={stats.total_products.toLocaleString('fa-IR')} sub={`کم موجود: ${stats.low_stock_count}`} color="bg-purple-100" icon={<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>} />
        <StatCard label="کاربران" value={stats.total_users.toLocaleString('fa-IR')} sub={`در انتظار: ${stats.pending_orders} سفارش`} color="bg-orange-100" icon={<svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>} />
      </div>

      {/* Revenue chart + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700 text-sm">درآمد ۷ روز اخیر</h2>
            <span className={`text-xs px-2 py-1 rounded-full ${stats.revenue_growth >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {stats.revenue_growth >= 0 ? '▲' : '▼'} {Math.abs(stats.revenue_growth)}٪
            </span>
          </div>
          <MiniBar data={stats.daily_revenue} />
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 text-sm mb-4">وضعیت سفارش‌ها</h2>
          <div className="space-y-2">
            {Object.entries(stats.status_counts).filter(([, v]) => v > 0).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[k] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[k] || k}</span>
                <span className="text-sm font-bold text-gray-700">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(stats.low_stock_count > 0 || stats.pending_orders > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.low_stock_count > 0 && (
            <Link href="/admin/products" className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors">
              <span className="text-2xl">⚠️</span>
              <div><div className="font-semibold text-orange-700 text-sm">{stats.low_stock_count} محصول کم موجود</div><div className="text-xs text-orange-600">نیاز به تأمین موجودی</div></div>
            </Link>
          )}
          {stats.pending_orders > 0 && (
            <Link href="/admin/orders?status=pending" className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors">
              <span className="text-2xl">📋</span>
              <div><div className="font-semibold text-blue-700 text-sm">{stats.pending_orders} سفارش در انتظار</div><div className="text-xs text-blue-600">نیاز به تأیید</div></div>
            </Link>
          )}
        </div>
      )}

      {/* Recent orders table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700 text-sm">آخرین سفارش‌ها</h2>
          <Link href="/admin/orders" className="text-xs text-primary hover:underline">مشاهده همه</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-right">
                <th className="px-4 py-3 font-medium text-gray-500 text-xs">#</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs">مشتری</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs">مبلغ</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs">وضعیت</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs">تاریخ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recent_orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{order.order_number}</td>
                  <td className="px-4 py-3 font-medium text-gray-700">{order.shipping_full_name}</td>
                  <td className="px-4 py-3 text-primary font-bold">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('fa-IR')}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="text-xs text-primary hover:underline">جزئیات</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/admin/products/new', label: 'محصول جدید', emoji: '➕' },
          { href: '/admin/blog/new', label: 'پست جدید', emoji: '✍️' },
          { href: '/admin/banners', label: 'مدیریت بنر', emoji: '🖼️' },
          { href: '/admin/categories', label: 'دسته‌بندی', emoji: '📂' },
        ].map(q => (
          <Link key={q.href} href={q.href} className="bg-white rounded-xl p-4 text-center hover:shadow-md hover:border-primary border border-gray-100 transition-all">
            <div className="text-2xl mb-1">{q.emoji}</div>
            <div className="text-xs font-medium text-gray-600">{q.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
