'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { adminApi, mediaUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';

interface Category { id: number; name: string; slug: string; }
interface Brand { id: number; name: string; }
interface ProductImage { id: number; image: string; alt: string; is_main: boolean; }

interface FormData {
  name: string; slug: string; part_number: string; description: string;
  category: string; brand: string; price: string; sale_price: string;
  stock: string; weight: string; badge: string;
  is_active: boolean; is_featured: boolean;
}

const EMPTY: FormData = {
  name: '', slug: '', part_number: '', description: '',
  category: '', brand: '', price: '', sale_price: '',
  stock: '', weight: '', badge: '',
  is_active: true, is_featured: false,
};

function slugify(str: string) {
  return str.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9؀-ۿ-]/g, '').toLowerCase();
}

export default function ProductForm({ productId }: { productId?: number }) {
  const router = useRouter();
  const isEdit = Boolean(productId);

  const [form, setForm] = useState<FormData>(EMPTY);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const upd = (k: keyof FormData, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    adminApi.categories().then(r => setCategories(r.data));
    adminApi.brands().then(r => setBrands(r.data));
    if (isEdit && productId) {
      adminApi.product(productId).then(r => {
        const p = r.data;
        setForm({
          name: p.name || '', slug: p.slug || '', part_number: p.part_number || '',
          description: p.description || '', category: String(p.category || ''),
          brand: String(p.brand || ''), price: String(p.price || ''),
          sale_price: String(p.sale_price ?? ''), stock: String(p.stock ?? ''),
          weight: String(p.weight || ''), badge: p.badge || '',
          is_active: p.is_active, is_featured: p.is_featured,
        });
        setImages(p.images || []);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [isEdit, productId]);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (pid: number) => {
    if (!imageFile) return;
    const fd = new FormData();
    fd.append('image', imageFile);
    fd.append('is_main', images.length === 0 ? 'true' : 'false');
    fd.append('alt', form.name);
    await adminApi.uploadProductImage(pid, fd);
  };

  const deleteImage = async (imgId: number) => {
    if (!productId) return;
    if (!confirm('حذف تصویر؟')) return;
    await adminApi.deleteProductImage(productId, imgId);
    setImages(imgs => {
      const remaining = imgs.filter(i => i.id !== imgId);
      // Mirror the backend: if the main image was removed, promote the first remaining one.
      if (!remaining.some(i => i.is_main) && remaining.length > 0) remaining[0].is_main = true;
      return [...remaining];
    });
    toast.success('تصویر حذف شد');
  };

  const setMainImage = async (imgId: number) => {
    if (!productId) return;
    try {
      await adminApi.setMainProductImage(productId, imgId);
      setImages(imgs => imgs.map(i => ({ ...i, is_main: i.id === imgId })));
      toast.success('تصویر اصلی تنظیم شد');
    } catch {
      toast.error('خطا در تنظیم تصویر اصلی');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('نام محصول الزامی است'); return; }
    if (!form.price) { toast.error('قیمت الزامی است'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name, slug: form.slug || slugify(form.name),
        part_number: form.part_number, description: form.description,
        category: form.category || null, brand: form.brand || null,
        price: form.price, sale_price: form.sale_price || null,
        stock: form.stock || '0', weight: form.weight || null,
        badge: form.badge || '', is_active: form.is_active, is_featured: form.is_featured,
      };
      let pid = productId!;
      if (isEdit) {
        await adminApi.updateProduct(pid, payload);
      } else {
        const { data } = await adminApi.createProduct(payload);
        pid = data.id;
      }
      if (imageFile) await uploadImage(pid);
      toast.success(isEdit ? 'محصول بروزرسانی شد' : 'محصول ایجاد شد');
      router.push('/admin/products');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: Record<string, unknown> } }).response?.data;
      toast.error(msg ? JSON.stringify(msg).slice(0, 100) : 'خطا در ذخیره');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Basic Info */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-4">اطلاعات پایه</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">نام محصول *</label>
            <input value={form.name} onChange={e => { upd('name', e.target.value); if (!isEdit) upd('slug', slugify(e.target.value)); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">اسلاگ (URL)</label>
            <input value={form.slug} onChange={e => upd('slug', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-mono text-xs" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">کد قطعه (Part Number)</label>
            <input value={form.part_number} onChange={e => upd('part_number', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">دسته‌بندی</label>
            <select value={form.category} onChange={e => upd('category', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
              <option value="">انتخاب دسته‌بندی</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">برند</label>
            <select value={form.brand} onChange={e => upd('brand', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
              <option value="">انتخاب برند</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">توضیحات</label>
            <textarea value={form.description} onChange={e => upd('description', e.target.value)}
              rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
          </div>
        </div>
      </div>

      {/* Pricing & Stock */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-4">قیمت و موجودی</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">قیمت (ریال) *</label>
            <input type="number" value={form.price} onChange={e => upd('price', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">قیمت تخفیفی (ریال)</label>
            <input type="number" value={form.sale_price} onChange={e => upd('sale_price', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">موجودی (عدد)</label>
            <input type="number" value={form.stock} onChange={e => upd('stock', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">وزن (کیلوگرم)</label>
            <input type="number" step="0.001" min="0" value={form.weight} onChange={e => upd('weight', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-4">تنظیمات</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">نشان محصول</label>
            <select value={form.badge} onChange={e => upd('badge', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
              <option value="">بدون نشان</option>
              <option value="new">جدید</option>
              <option value="sale">حراج</option>
              <option value="original">اصلی</option>
              <option value="hot">پرفروش</option>
            </select>
          </div>
          <div className="flex items-center gap-6 pt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => upd('is_active', e.target.checked)} className="accent-primary" />
              <span className="text-sm text-gray-600">فعال</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={e => upd('is_featured', e.target.checked)} className="accent-primary" />
              <span className="text-sm text-gray-600">ویژه</span>
            </label>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-1">تصاویر</h2>
        {/* Existing images */}
        {images.length > 0 && (
          <>
            <p className="text-xs text-gray-400 mb-3">برای انتخاب تصویر اصلی، روی آن کلیک کنید.</p>
            <div className="flex flex-wrap gap-3 mb-4">
              {images.map(img => (
                <div key={img.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => !img.is_main && setMainImage(img.id)}
                    title={img.is_main ? 'تصویر اصلی' : 'تنظیم به عنوان تصویر اصلی'}
                    aria-pressed={img.is_main}
                    className={`block w-20 h-20 rounded-lg border-2 overflow-hidden bg-gray-50 transition-colors ${img.is_main ? 'border-primary cursor-default' : 'border-gray-200 hover:border-primary cursor-pointer'}`}
                  >
                    <Image src={mediaUrl(img.image)} alt={img.alt} width={80} height={80} className="object-contain w-full h-full" />
                  </button>
                  {img.is_main
                    ? <span className="absolute top-0 right-0 bg-primary text-white text-[8px] px-1 rounded">اصلی</span>
                    : <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">اصلی کن</span>}
                  <button type="button" onClick={() => deleteImage(img.id)} title="حذف تصویر"
                    className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center">×</button>
                </div>
              ))}
            </div>
          </>
        )}
        {/* Upload new */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">افزودن تصویر</label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary transition-colors flex flex-col items-center gap-2 w-40">
              {imagePreview
                ? <Image src={imagePreview} alt="preview" width={80} height={80} className="object-contain rounded" />
                : <><svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg><span className="text-xs text-gray-400">آپلود تصویر</span></>}
              <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
            </label>
            {imagePreview && <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="text-xs text-red-500 hover:underline">حذف</button>}
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="bg-primary text-white px-8 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
          {saving ? 'در حال ذخیره...' : isEdit ? 'بروزرسانی محصول' : 'ایجاد محصول'}
        </button>
        <button type="button" onClick={() => router.push('/admin/products')}
          className="border border-gray-200 text-gray-600 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
          انصراف
        </button>
      </div>
    </form>
  );
}
