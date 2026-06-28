'use client';
import { useEffect, useState, useCallback } from 'react';
import { adminApi, formatPrice } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

interface User {
  id: number; username: string; email: string; first_name: string; last_name: string;
  is_active: boolean; is_staff: boolean; date_joined: string;
  order_count: number; total_spent: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<User | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = { page };
    if (search) params.search = search;
    if (filter === 'staff') params.is_staff = 'true';
    if (filter === 'inactive') params.is_active = 'false';
    try {
      const { data } = await adminApi.users(params);
      setUsers(data.results || data);
      setCount(data.count || data.length);
    } finally { setLoading(false); }
  }, [search, filter, page]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (u: User, field: 'is_active' | 'is_staff') => {
    const val = !u[field];
    try {
      await adminApi.updateUser(u.id, { [field]: val });
      setUsers(us => us.map(x => x.id === u.id ? { ...x, [field]: val } : x));
    } catch { toast.error('خطا'); }
  };

  const totalPages = Math.ceil(count / 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">کاربران</h1>
          <p className="text-sm text-gray-500 mt-0.5">{count} کاربر</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-wrap gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="جستجو نام، نام کاربری، ایمیل..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary flex-1 min-w-48" />
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
          <option value="">همه کاربران</option>
          <option value="staff">مدیران</option>
          <option value="inactive">غیرفعال</option>
        </select>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-bold text-gray-800 mb-1">{editing.first_name} {editing.last_name}</h2>
            <p className="text-sm text-gray-400 mb-4">{editing.email}</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">حساب فعال</span>
                <span dir="ltr"><button onClick={() => { toggle(editing, 'is_active'); setEditing(u => u ? { ...u, is_active: !u.is_active } : null); }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editing.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editing.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button></span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">دسترسی مدیریت</span>
                <span dir="ltr"><button onClick={() => { toggle(editing, 'is_staff'); setEditing(u => u ? { ...u, is_staff: !u.is_staff } : null); }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editing.is_staff ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editing.is_staff ? 'translate-x-6' : 'translate-x-1'}`} />
                </button></span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400 space-y-1">
              <div>سفارش‌ها: {editing.order_count}</div>
              <div>مجموع خرید: {formatPrice(editing.total_spent)}</div>
            </div>
            <button onClick={() => setEditing(null)} className="w-full mt-4 border border-gray-200 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">بستن</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <div className="flex justify-center py-16"><Spinner /></div> : users.length === 0
          ? <div className="text-center py-16 text-gray-400">کاربری یافت نشد</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-right">
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">کاربر</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">نام کاربری</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">سفارش‌ها</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">مجموع خرید</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">وضعیت</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">تاریخ عضویت</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                            {(u.first_name || u.username)[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800 text-sm">{u.first_name} {u.last_name}</div>
                            <div className="text-gray-400 text-xs">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{u.username}</td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-gray-700">{u.order_count}</td>
                      <td className="px-4 py-3 text-sm text-primary">{u.total_spent > 0 ? formatPrice(u.total_spent) : '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{u.is_active ? 'فعال' : 'غیرفعال'}</span>
                          {u.is_staff && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">مدیر</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.date_joined).toLocaleDateString('fa-IR')}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setEditing(u)} className="text-xs text-blue-600 hover:underline">ویرایش</button>
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
