'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { adminApi, formatPrice, mediaUrl } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

interface Product {
  id: number; name: string; slug: string; part_number: string;
  price: number; sale_price: number | null; effective_price: number;
  stock: number; badge: string; is_active: boolean; is_featured: boolean;
  category_name: string; brand_name: string;
  main_image: { image: string } | null; created_at: string;
}

const BADGE_LABELS: Record<string, string> = { new: 'جدید', sale: 'حراج', original: 'اصلی', hot: 'پرفروش', '': '-' };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({ is_active: '', badge: '' });
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = { page };
    if (search) params.search = search;
    if (filter.is_active) params.is_active = filter.is_active;
    if (filter.badge) params.badge = filter.badge;
    try {
      const { data } = await adminApi.products(params);
      setProducts(data.results || data);
      setCount(data.count ?? data.length);
    } finally { setLoading(false); }
  }, [search, filter, page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`آیا از حذف "${name}" مطمئن هستید؟`)) return;
    setDeleting(id);
    try {
      await adminApi.deleteProduct(id);
      toast.success('محصول حذف شد');
      load();
    } catch { toast.error('خطا در حذف'); }
    finally { setDeleting(null); }
  };

  const toggleActive = async (id: number, current: boolean) => {
    try {
      await adminApi.updateProduct(id, { is_active: !current });
      setProducts(ps => ps.map(p => p.id === id ? { ...p, is_active: !current } : p));
    } catch { toast.error('خطا'); }
  };

  const totalPages = Math.ceil(count / 20);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">محصولات</h1>
          <p className="text-sm text-gray-500 mt-0.5">{count} محصول</p>
        </div>
        <Link href="/admin/products/new" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
          <span>+</span> محصول جدید
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-wrap gap-3">
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="جستجو نام، کد قطعه..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary flex-1 min-w-48"
        />
        <select value={filter.is_active} onChange={e => { setFilter(f => ({ ...f, is_active: e.target.value })); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
          <option value="">همه وضعیت‌ها</option>
          <option value="true">فعال</option>
          <option value="false">غیرفعال</option>
        </select>
        <select value={filter.badge} onChange={e => { setFilter(f => ({ ...f, badge: e.target.value })); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
          <option value="">همه نشان‌ها</option>
          <option value="new">جدید</option>
          <option value="sale">حراج</option>
          <option value="original">اصلی</option>
          <option value="hot">پرفروش</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">محصولی یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-right">
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs">تصویر</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs">نام محصول</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs">کد قطعه</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs">قیمت</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs">موجودی</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs">دسته</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs">نشان</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs">وضعیت</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                        {p.main_image
                          ? <Image src={mediaUrl(p.main_image.image)} alt={p.name} width={40} height={40} className="object-contain" />
                          : <span className="text-gray-400 text-xs">🔧</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 text-xs line-clamp-1 max-w-48">{p.name}</div>
                      <div className="text-gray-400 text-[10px]">{p.brand_name}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.part_number || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-bold text-gray-700">{formatPrice(p.effective_price)}</div>
                      {p.sale_price && <div className="text-[10px] text-gray-400 line-through">{formatPrice(p.price)}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${p.stock <= 5 ? 'text-red-500' : p.stock <= 20 ? 'text-orange-500' : 'text-green-600'}`}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.category_name}</td>
                    <td className="px-4 py-3">
                      {p.badge && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{BADGE_LABELS[p.badge]}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span dir="ltr">
                        <button onClick={() => toggleActive(p.id, p.is_active)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${p.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${p.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/products/${p.id}`} className="text-xs text-blue-600 hover:underline">ویرایش</Link>
                        <button onClick={() => handleDelete(p.id, p.name)} disabled={deleting === p.id}
                          className="text-xs text-red-500 hover:underline disabled:opacity-50">حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
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
