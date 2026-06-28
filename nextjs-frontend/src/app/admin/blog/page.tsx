'use client';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { adminApi, mediaUrl } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

interface Post {
  id: number; title: string; slug: string; image: string | null;
  category_name: string; is_published: boolean; views: number; created_at: string;
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [publishFilter, setPublishFilter] = useState('');
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = { page };
    if (search) params.search = search;
    if (publishFilter) params.is_published = publishFilter;
    try {
      const { data } = await adminApi.posts(params);
      setPosts(data.results || data);
      setCount(data.count || data.length);
    } finally { setLoading(false); }
  }, [search, publishFilter, page]);

  useEffect(() => { load(); }, [load]);

  const togglePublish = async (id: number, current: boolean) => {
    try {
      await adminApi.updatePost(id, { is_published: !current });
      setPosts(ps => ps.map(p => p.id === id ? { ...p, is_published: !current } : p));
    } catch { toast.error('خطا'); }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`حذف "${title}"؟`)) return;
    setDeleting(id);
    try {
      await adminApi.deletePost(id);
      toast.success('پست حذف شد');
      load();
    } catch { toast.error('خطا در حذف'); }
    finally { setDeleting(null); }
  };

  const totalPages = Math.ceil(count / 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">وبلاگ</h1>
          <p className="text-sm text-gray-500 mt-0.5">{count} پست</p>
        </div>
        <button onClick={() => router.push('/admin/blog/new')} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">+ پست جدید</button>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="جستجو عنوان..."
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
        <select value={publishFilter} onChange={e => { setPublishFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
          <option value="">همه</option>
          <option value="true">منتشر شده</option>
          <option value="false">پیش‌نویس</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <div className="flex justify-center py-16"><Spinner /></div> : posts.length === 0
          ? <div className="text-center py-16 text-gray-400">پستی یافت نشد</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-right">
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">تصویر</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">عنوان</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">دسته‌بندی</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">بازدید</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">انتشار</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">تاریخ</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {posts.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                          {p.image
                            ? <Image src={mediaUrl(p.image)} alt={p.title} width={48} height={48} className="object-cover w-full h-full" />
                            : <div className="flex items-center justify-center h-full text-gray-300 text-lg">📝</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800 text-sm max-w-xs line-clamp-2">{p.title}</div>
                        <div className="text-gray-400 text-xs font-mono">{p.slug}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{p.category_name}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{p.views}</td>
                      <td className="px-4 py-3">
                        <span dir="ltr"><button onClick={() => togglePublish(p.id, p.is_published)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${p.is_published ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${p.is_published ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button></span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString('fa-IR')}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => router.push(`/admin/blog/${p.id}`)} className="text-xs text-blue-600 hover:underline">ویرایش</button>
                          <button onClick={() => handleDelete(p.id, p.title)} disabled={deleting === p.id} className="text-xs text-red-500 hover:underline disabled:opacity-50">حذف</button>
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
              className={`w-8 h-8 rounded-lg text-xs ${page === p ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'}`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
