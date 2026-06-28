'use client';
import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

interface Review {
  id: number; product: number; product_name: string;
  user: number; user_name: string;
  rating: number; title: string; body: string;
  is_approved: boolean; created_at: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`w-3 h-3 ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pendingTotal, setPendingTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = { page };
    if (filter === 'approved') params.is_approved = 'true';
    if (filter === 'pending') params.is_approved = 'false';
    if (search) params.search = search;
    try {
      const { data } = await adminApi.reviews(params);
      setReviews(data.results || data);
      setCount(data.count || data.length);
    } finally { setLoading(false); }
  }, [filter, search, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    adminApi.reviews({ is_approved: 'false', page_size: 1 })
      .then(r => setPendingTotal(r.data.count ?? 0))
      .catch(() => {});
  }, []);

  const toggleApprove = async (r: Review) => {
    try {
      await adminApi.approveReview(r.id, !r.is_approved);
      setReviews(rs => rs.map(x => x.id === r.id ? { ...x, is_approved: !r.is_approved } : x));
      toast.success(r.is_approved ? 'نقد رد شد' : 'نقد تأیید شد');
    } catch { toast.error('خطا'); }
  };

  const handleDelete = async (r: Review) => {
    if (!confirm(`حذف نقد "${r.title || 'بدون عنوان'}"؟`)) return;
    try {
      await adminApi.deleteReview(r.id);
      toast.success('نقد حذف شد');
      load();
    } catch { toast.error('خطا در حذف'); }
  };

  const totalPages = Math.ceil(count / 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">نقد و بررسی‌ها</h1>
          <p className="text-sm text-gray-500 mt-0.5">{count} نقد {pendingTotal > 0 && `· ${pendingTotal} در انتظار تأیید`}</p>
        </div>
        {pendingTotal > 0 && (
          <span className="bg-orange-100 text-orange-700 text-xs px-3 py-1.5 rounded-full font-medium">
            {pendingTotal} نقد در انتظار
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-wrap gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="جستجو عنوان، محصول، کاربر..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary flex-1 min-w-48" />
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
          <option value="">همه نقدها</option>
          <option value="pending">در انتظار تأیید</option>
          <option value="approved">تأیید شده</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 text-gray-400">نقدی یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-right">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">محصول</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">کاربر</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">امتیاز</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">عنوان</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">متن</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">تاریخ</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">وضعیت</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reviews.map(r => (
                  <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${!r.is_approved ? 'bg-orange-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-gray-800 max-w-32 line-clamp-2">{r.product_name}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{r.user_name}</td>
                    <td className="px-4 py-3"><StarRating rating={r.rating} /></td>
                    <td className="px-4 py-3 text-xs text-gray-700 max-w-28 line-clamp-1">{r.title || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500 max-w-48 line-clamp-2">{r.body}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.is_approved ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {r.is_approved ? 'تأیید شده' : 'در انتظار'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-center whitespace-nowrap">
                        <button onClick={() => toggleApprove(r)}
                          className={`text-xs px-2 py-1 rounded-lg border transition-colors ${r.is_approved ? 'border-gray-200 text-gray-500 hover:bg-gray-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                          {r.is_approved ? 'رد' : 'تأیید'}
                        </button>
                        <button onClick={() => handleDelete(r)} className="text-xs text-red-500 hover:underline">حذف</button>
                      </div>
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
              className={`w-8 h-8 rounded-lg text-xs ${page === p ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
