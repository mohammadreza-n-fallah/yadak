'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { adminApi, mediaUrl } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

interface Banner {
  id: number; title: string; subtitle: string; image: string;
  link: string; position: string; is_active: boolean; order: number;
}

interface FormState { title: string; subtitle: string; link: string; position: string; is_active: boolean; order: string; }
const EMPTY: FormState = { title: '', subtitle: '', link: '', position: 'hero', is_active: true, order: '0' };

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => adminApi.banners().then(r => { setBanners(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY); setImageFile(null); setImagePreview(null); setShowForm(true); };
  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({ title: b.title, subtitle: b.subtitle || '', link: b.link || '', position: b.position, is_active: b.is_active, order: String(b.order) });
    setImagePreview(b.image ? mediaUrl(b.image) : null);
    setImageFile(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing && !imageFile) { toast.error('تصویر الزامی است'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('subtitle', form.subtitle);
      fd.append('link', form.link);
      fd.append('position', form.position);
      fd.append('is_active', String(form.is_active));
      fd.append('order', form.order);
      if (imageFile) fd.append('image', imageFile);

      if (editing) {
        await adminApi.updateBanner(editing.id, fd);
        toast.success('بنر بروزرسانی شد');
      } else {
        await adminApi.createBanner(fd);
        toast.success('بنر ایجاد شد');
      }
      setShowForm(false);
      load();
    } catch { toast.error('خطا در ذخیره'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (b: Banner) => {
    if (!confirm(`حذف بنر "${b.title}"؟`)) return;
    try {
      await adminApi.deleteBanner(b.id);
      toast.success('بنر حذف شد');
      load();
    } catch { toast.error('خطا در حذف بنر'); }
  };

  const POSITIONS: Record<string, string> = { hero: 'هدر اصلی', sidebar: 'کنار', promo: 'تبلیغاتی', footer: 'فوتر' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">بنرها</h1>
        <button onClick={openNew} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">+ بنر جدید</button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-gray-800 mb-4">{editing ? 'ویرایش بنر' : 'بنر جدید'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">عنوان *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">زیرعنوان</label>
                <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">لینک</label>
                <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="/shop"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">موقعیت</label>
                  <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    {Object.entries(POSITIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ترتیب</label>
                  <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">تصویر {!editing && '*'}</label>
                <div className="flex items-center gap-3">
                  {imagePreview && <Image src={imagePreview} alt="preview" width={64} height={40} className="rounded object-cover border" />}
                  <label className="cursor-pointer border border-dashed border-gray-300 rounded-lg px-3 py-2 text-xs text-blue-600 hover:border-primary">
                    انتخاب فایل
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="b-active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-primary" />
                <label htmlFor="b-active" className="text-sm text-gray-600">فعال</label>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                  {saving ? '...' : editing ? 'بروزرسانی' : 'ایجاد'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <div className="flex justify-center py-16"><Spinner /></div> : banners.length === 0
          ? <div className="text-center py-16 text-gray-400">بنری وجود ندارد</div>
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {banners.map(b => (
                <div key={b.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative h-32 bg-gray-100">
                    {b.image && <Image src={mediaUrl(b.image)} alt={b.title} fill className="object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-2 right-2">
                      <span className="text-[10px] bg-white/20 text-white backdrop-blur-sm px-1.5 py-0.5 rounded">{POSITIONS[b.position] || b.position}</span>
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {b.is_active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="font-medium text-gray-800 text-sm">{b.title}</div>
                    {b.subtitle && <div className="text-gray-400 text-xs mt-0.5">{b.subtitle}</div>}
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => openEdit(b)} className="flex-1 text-xs text-blue-600 border border-blue-100 rounded-lg py-1 hover:bg-blue-50">ویرایش</button>
                      <button onClick={() => handleDelete(b)} className="flex-1 text-xs text-red-500 border border-red-100 rounded-lg py-1 hover:bg-red-50">حذف</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
