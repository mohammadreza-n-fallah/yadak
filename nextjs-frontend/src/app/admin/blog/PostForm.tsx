'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { adminApi, mediaUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';

interface PostCategory { id: number; name: string; }
interface FormState {
  title: string; slug: string; excerpt: string; body: string;
  category: string; is_published: boolean;
}
const EMPTY: FormState = { title: '', slug: '', excerpt: '', body: '', category: '', is_published: false };

function slugify(s: string) { return s.trim().replace(/\s+/g, '-').toLowerCase(); }

export default function PostForm({ postId }: { postId?: number }) {
  const router = useRouter();
  const isEdit = Boolean(postId);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);

  const upd = (k: keyof FormState, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const loadCategories = async () => {
    const r = await adminApi.postCategories();
    setCategories(r.data);
    return r.data as PostCategory[];
  };

  useEffect(() => {
    loadCategories();
    if (isEdit && postId) {
      adminApi.post(postId).then(r => {
        const p = r.data;
        setForm({ title: p.title || '', slug: p.slug || '', excerpt: p.excerpt || '', body: p.body || '', category: String(p.category || ''), is_published: p.is_published });
        if (p.image) setImagePreview(mediaUrl(p.image));
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [isEdit, postId]);

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      const { data } = await adminApi.createPostCategory({ name: newCatName.trim(), slug: slugify(newCatName.trim()) });
      const updated = await loadCategories();
      const added = updated.find((c: PostCategory) => c.id === data.id);
      if (added) upd('category', String(added.id));
      setNewCatName('');
      setShowNewCat(false);
      toast.success('دسته‌بندی اضافه شد');
    } catch {
      toast.error('خطا در افزودن دسته‌بندی');
    } finally {
      setAddingCat(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { toast.error('عنوان الزامی است'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('slug', form.slug || slugify(form.title));
      fd.append('excerpt', form.excerpt);
      fd.append('body', form.body);
      if (form.category) fd.append('category', form.category);
      fd.append('is_published', String(form.is_published));
      if (imageFile) fd.append('image', imageFile);

      if (isEdit && postId) {
        await adminApi.updatePost(postId, fd);
        toast.success('پست بروزرسانی شد');
      } else {
        await adminApi.createPost(fd);
        toast.success('پست ایجاد شد');
      }
      router.push('/admin/blog');
    } catch { toast.error('خطا در ذخیره'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">عنوان *</label>
          <input value={form.title} onChange={e => { upd('title', e.target.value); if (!isEdit) upd('slug', slugify(e.target.value)); }}
            required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Slug */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">اسلاگ</label>
            <input value={form.slug} onChange={e => upd('slug', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-mono text-xs" />
          </div>

          {/* Category + inline add */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-600">دسته‌بندی</label>
              <button type="button" onClick={() => setShowNewCat(v => !v)}
                className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                <span>+</span> دسته جدید
              </button>
            </div>
            {showNewCat ? (
              <div className="flex gap-1">
                <input
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                  placeholder="نام دسته..."
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
                  autoFocus
                />
                <button type="button" onClick={handleAddCategory} disabled={addingCat || !newCatName.trim()}
                  className="bg-primary text-white px-2.5 py-1.5 rounded-lg text-xs disabled:opacity-50">
                  {addingCat ? '...' : 'اضافه'}
                </button>
                <button type="button" onClick={() => { setShowNewCat(false); setNewCatName(''); }}
                  className="text-gray-400 hover:text-gray-600 px-1.5 py-1.5 text-sm">✕</button>
              </div>
            ) : (
              <select value={form.category} onChange={e => upd('category', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                <option value="">بدون دسته</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">خلاصه</label>
          <textarea value={form.excerpt} onChange={e => upd('excerpt', e.target.value)} rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
        </div>

        {/* Body */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">محتوا</label>
          <textarea value={form.body} onChange={e => upd('body', e.target.value)} rows={12}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-y font-mono"
            placeholder="محتوای پست را وارد کنید (HTML پشتیبانی می‌شود)" />
        </div>

        {/* Image */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">تصویر شاخص</label>
          <div className="flex items-center gap-3">
            {imagePreview && (
              <div className="relative group">
                <Image src={imagePreview} alt="preview" width={80} height={60} className="rounded-lg object-cover border" />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center">
                  ×
                </button>
              </div>
            )}
            <label className="cursor-pointer border border-dashed border-gray-300 rounded-lg px-4 py-2 text-xs text-blue-600 hover:border-primary transition-colors">
              {imagePreview ? 'تغییر تصویر' : 'انتخاب تصویر'}
              <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />
            </label>
          </div>
        </div>

        {/* Published toggle */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
          <input type="checkbox" id="pub" checked={form.is_published} onChange={e => upd('is_published', e.target.checked)} className="accent-primary" />
          <label htmlFor="pub" className="text-sm text-gray-600 cursor-pointer">
            منتشر شود
            {!form.is_published && <span className="text-xs text-gray-400 mr-2">(پیش‌نویس)</span>}
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="bg-primary text-white px-8 py-2.5 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
          {saving ? 'در حال ذخیره...' : isEdit ? 'بروزرسانی پست' : form.is_published ? 'انتشار پست' : 'ذخیره پیش‌نویس'}
        </button>
        <button type="button" onClick={() => router.push('/admin/blog')} className="border border-gray-200 px-6 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50">انصراف</button>
      </div>
    </form>
  );
}
