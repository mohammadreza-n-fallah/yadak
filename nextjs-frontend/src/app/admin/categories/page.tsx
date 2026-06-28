'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { adminApi, mediaUrl } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

interface Category {
  id: number; name: string; slug: string; image: string | null;
  parent: number | null; parent_name: string | null;
  is_active: boolean; order: number; product_count: number;
}

interface FormState { name: string; slug: string; parent: string; is_active: boolean; order: string; }

const EMPTY: FormState = { name: '', slug: '', parent: '', is_active: true, order: '0' };

function slugify(s: string) { return s.trim().replace(/\s+/g, '-').toLowerCase(); }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    adminApi.categories().then(r => { setCategories(r.data); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY); setImageFile(null); setImagePreview(null); setShowForm(true); };
  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, parent: String(cat.parent || ''), is_active: cat.is_active, order: String(cat.order) });
    setImagePreview(cat.image ? mediaUrl(cat.image) : null);
    setImageFile(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('slug', form.slug || slugify(form.name));
      if (form.parent) fd.append('parent', form.parent);
      fd.append('is_active', String(form.is_active));
      fd.append('order', form.order);
      if (imageFile) fd.append('image', imageFile);

      if (editing) {
        await adminApi.updateCategory(editing.id, fd);
        toast.success('دسته‌بندی بروزرسانی شد');
      } else {
        await adminApi.createCategory(fd);
        toast.success('دسته‌بندی ایجاد شد');
      }
      setShowForm(false);
      load();
    } catch { toast.error('خطا در ذخیره'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`حذف "${cat.name}"؟`)) return;
    try {
      await adminApi.deleteCategory(cat.id);
      toast.success('حذف شد');
      load();
    } catch { toast.error('خطا در حذف دسته‌بندی'); }
  };

  const rootCats = categories.filter(c => !c.parent);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">دسته‌بندی‌ها</h1>
        <button onClick={openNew} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">+ دسته‌بندی جدید</button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-bold text-gray-800 mb-4">{editing ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">نام *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
                  required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">اسلاگ</label>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-mono" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">دسته والد</label>
                <select value={form.parent} onChange={e => setForm(f => ({ ...f, parent: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value="">دسته ریشه</option>
                  {rootCats.filter(c => c.id !== editing?.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">ترتیب</label>
                  <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-primary" id="cat-active" />
                  <label htmlFor="cat-active" className="text-sm text-gray-600">فعال</label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">تصویر</label>
                <div className="flex items-center gap-3">
                  {imagePreview && <Image src={imagePreview} alt="preview" width={48} height={48} className="rounded-lg object-contain border" />}
                  <label className="cursor-pointer text-xs text-blue-600 hover:underline border border-gray-200 px-3 py-1.5 rounded-lg">
                    انتخاب فایل
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />
                  </label>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                  {saving ? '...' : editing ? 'بروزرسانی' : 'ایجاد'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-right">
                <th className="px-4 py-3 text-xs font-medium text-gray-500">نام</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">والد</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">محصولات</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">وضعیت</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {cat.image && <Image src={mediaUrl(cat.image)} alt={cat.name} width={28} height={28} className="rounded object-contain" />}
                      <span className={`font-medium text-gray-800 text-sm ${cat.parent ? 'pr-4 text-gray-600' : ''}`}>{cat.parent ? '↳ ' : ''}{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{cat.parent_name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{cat.product_count}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {cat.is_active ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(cat)} className="text-xs text-blue-600 hover:underline">ویرایش</button>
                      <button onClick={() => handleDelete(cat)} className="text-xs text-red-500 hover:underline">حذف</button>
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
