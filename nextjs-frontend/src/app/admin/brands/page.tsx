'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { adminApi, mediaUrl } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

interface Brand {
  id: number; name: string; slug: string; logo: string | null;
  is_active: boolean; order: number; product_count: number;
}
interface FormState { name: string; slug: string; is_active: boolean; order: string; }
const EMPTY: FormState = { name: '', slug: '', is_active: true, order: '0' };

function slugify(s: string) { return s.trim().replace(/\s+/g, '-').toLowerCase(); }

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = () => {
    adminApi.brands({ search: search || undefined }).then(r => {
      setBrands(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, [search]);

  const openNew = () => {
    setEditing(null); setForm(EMPTY); setLogoFile(null); setLogoPreview(null); setShowForm(true);
  };
  const openEdit = (b: Brand) => {
    setEditing(b);
    setForm({ name: b.name, slug: b.slug, is_active: b.is_active, order: String(b.order) });
    setLogoPreview(b.logo ? mediaUrl(b.logo) : null);
    setLogoFile(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('نام برند الزامی است'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('slug', form.slug || slugify(form.name));
      fd.append('is_active', String(form.is_active));
      fd.append('order', form.order);
      if (logoFile) fd.append('logo', logoFile);

      if (editing) {
        await adminApi.updateBrand(editing.id, fd);
        toast.success('برند بروزرسانی شد');
      } else {
        await adminApi.createBrand(fd);
        toast.success('برند ایجاد شد');
      }
      setShowForm(false);
      load();
    } catch { toast.error('خطا در ذخیره'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (b: Brand) => {
    if (!confirm(`حذف برند "${b.name}"؟`)) return;
    try {
      await adminApi.deleteBrand(b.id);
      toast.success('برند حذف شد');
      load();
    } catch { toast.error('خطا در حذف'); }
  };

  const toggleActive = async (b: Brand) => {
    try {
      await adminApi.updateBrand(b.id, { is_active: !b.is_active });
      setBrands(bs => bs.map(x => x.id === b.id ? { ...x, is_active: !b.is_active } : x));
    } catch { toast.error('خطا'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">برندها</h1>
          <p className="text-sm text-gray-500 mt-0.5">{brands.length} برند</p>
        </div>
        <button onClick={openNew} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">+ برند جدید</button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="جستجو نام برند..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-bold text-gray-800 mb-4">{editing ? 'ویرایش برند' : 'برند جدید'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">نام برند *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: editing ? f.slug : slugify(e.target.value) }))}
                  required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">اسلاگ</label>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-mono text-xs" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">ترتیب</label>
                  <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="brand-active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-primary" />
                  <label htmlFor="brand-active" className="text-sm text-gray-600">فعال</label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">لوگو</label>
                <div className="flex items-center gap-3">
                  {logoPreview && (
                    <div className="w-12 h-12 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                      <Image src={logoPreview} alt="logo" width={48} height={48} className="object-contain" />
                    </div>
                  )}
                  <label className="cursor-pointer border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-blue-600 hover:border-primary hover:bg-blue-50 transition-colors">
                    انتخاب فایل
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }
                    }} />
                  </label>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                  {saving ? '...' : editing ? 'بروزرسانی' : 'ایجاد'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : brands.length === 0 ? (
          <div className="text-center py-16 text-gray-400">برندی یافت نشد</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-right">
                <th className="px-4 py-3 text-xs font-medium text-gray-500">لوگو</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">نام برند</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">اسلاگ</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">محصولات</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">ترتیب</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">وضعیت</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {brands.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden">
                      {b.logo
                        ? <Image src={mediaUrl(b.logo)} alt={b.name} width={40} height={40} className="object-contain" />
                        : <span className="text-gray-400 text-xs font-bold">{b.name.charAt(0)}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{b.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{b.slug}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{b.product_count}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-500">{b.order}</td>
                  <td className="px-4 py-3">
                    <span dir="ltr"><button onClick={() => toggleActive(b)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${b.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${b.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button></span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(b)} className="text-xs text-blue-600 hover:underline">ویرایش</button>
                      <button onClick={() => handleDelete(b)} className="text-xs text-red-500 hover:underline">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
