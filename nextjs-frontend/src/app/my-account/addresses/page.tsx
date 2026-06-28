'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api';
import { Address } from '@/types';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

const PROVINCE_CHOICES = [
  { value: 'alborz', label: 'البرز' }, { value: 'ardabil', label: 'اردبیل' },
  { value: 'isfahan', label: 'اصفهان' }, { value: 'ilam', label: 'ایلام' },
  { value: 'azerbaijan_east', label: 'آذربایجان شرقی' },
  { value: 'azerbaijan_west', label: 'آذربایجان غربی' },
  { value: 'bushehr', label: 'بوشهر' }, { value: 'tehran', label: 'تهران' },
  { value: 'chaharmahal', label: 'چهارمحال و بختیاری' },
  { value: 'south_khorasan', label: 'خراسان جنوبی' },
  { value: 'khorasan_razavi', label: 'خراسان رضوی' },
  { value: 'north_khorasan', label: 'خراسان شمالی' },
  { value: 'khuzestan', label: 'خوزستان' }, { value: 'zanjan', label: 'زنجان' },
  { value: 'semnan', label: 'سمنان' }, { value: 'sistan', label: 'سیستان و بلوچستان' },
  { value: 'fars', label: 'فارس' }, { value: 'qazvin', label: 'قزوین' },
  { value: 'qom', label: 'قم' }, { value: 'kurdistan', label: 'کردستان' },
  { value: 'kerman', label: 'کرمان' }, { value: 'kermanshah', label: 'کرمانشاه' },
  { value: 'kohgiluyeh', label: 'کهگیلویه و بویراحمد' },
  { value: 'golestan', label: 'گلستان' }, { value: 'Gilan', label: 'گیلان' },
  { value: 'lorestan', label: 'لرستان' }, { value: 'mazandaran', label: 'مازندران' },
  { value: 'markazi', label: 'مرکزی' }, { value: 'hormozgan', label: 'هرمزگان' },
  { value: 'hamadan', label: 'همدان' }, { value: 'yazd', label: 'یزد' },
];

const provinceLabel = (value: string) =>
  PROVINCE_CHOICES.find(p => p.value === value)?.label || value;

const EMPTY_FORM = {
  full_name: '', phone: '', province: '', city: '', address: '', postal_code: '', is_default: false,
};

type AddressForm = typeof EMPTY_FORM;

export default function AddressesPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<AddressForm>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchAddresses = useCallback(async () => {
    try {
      const { data } = await authApi.addresses();
      setAddresses(data.results ?? data);
    } catch {
      toast.error('خطا در دریافت آدرس‌ها');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    fetchAddresses();
  }, [_hasHydrated, isAuthenticated, fetchAddresses, router]);

  const openAdd = () => {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setShowForm(true);
    setTimeout(() => document.getElementById('addr-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const openEdit = (addr: Address) => {
    setForm({
      full_name: addr.full_name, phone: addr.phone, province: addr.province,
      city: addr.city, address: addr.address, postal_code: addr.postal_code,
      is_default: addr.is_default,
    });
    setEditId(addr.id);
    setShowForm(true);
    setTimeout(() => document.getElementById('addr-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.province) { toast.error('لطفاً استان را انتخاب کنید'); return; }
    setSaving(true);
    try {
      if (editId !== null) {
        await authApi.updateAddress(editId, form);
        toast.success('آدرس ویرایش شد');
      } else {
        await authApi.addAddress(form);
        toast.success('آدرس جدید اضافه شد');
      }
      setShowForm(false);
      setEditId(null);
      fetchAddresses();
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: Record<string, unknown> } }).response?.data;
      const msg = errData ? Object.values(errData).flat().join(' — ') : 'خطا در ذخیره آدرس';
      toast.error(msg as string);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این آدرس اطمینان دارید؟')) return;
    setDeletingId(id);
    try {
      await authApi.deleteAddress(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
      toast.success('آدرس حذف شد');
    } catch {
      toast.error('خطا در حذف آدرس');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (addr: Address) => {
    if (addr.is_default) return;
    try {
      await authApi.updateAddress(addr.id, { is_default: true });
      setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === addr.id })));
      toast.success('آدرس پیش‌فرض تغییر یافت');
    } catch {
      toast.error('خطا در تغییر آدرس پیش‌فرض');
    }
  };

  if (!_hasHydrated || loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <nav className="text-sm text-muted mb-6 flex items-center gap-2">
        <Link href="/my-account" className="hover:text-primary">حساب کاربری</Link>
        <span>/</span>
        <span className="text-dark-2">آدرس‌ها</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">آدرس‌های من</h1>
        {!showForm && (
          <button onClick={openAdd} className="btn-primary text-sm px-4 py-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            افزودن آدرس
          </button>
        )}
      </div>

      {/* Address list */}
      {addresses.length === 0 && !showForm ? (
        <div className="text-center py-16 card p-10">
          <div className="text-5xl mb-4">📍</div>
          <p className="font-semibold text-dark-2 mb-2">هنوز آدرسی ثبت نشده است</p>
          <p className="text-sm text-muted mb-4">آدرس خود را اضافه کنید تا خرید سریع‌تری داشته باشید</p>
          <button onClick={openAdd} className="btn-primary px-5 py-2 text-sm">افزودن اولین آدرس</button>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {addresses.map(addr => (
            <div key={addr.id} className={`card p-4 border-2 transition-colors ${addr.is_default ? 'border-primary/40' : 'border-transparent'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-dark-2 text-sm">{addr.full_name}</span>
                    {addr.is_default && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">پیش‌فرض</span>
                    )}
                  </div>
                  <div className="text-xs text-muted space-y-0.5">
                    <div>{addr.address}</div>
                    <div className="flex items-center gap-2">
                      <span>{provinceLabel(addr.province)} — {addr.city}</span>
                      <span>•</span>
                      <span>کد پستی: {addr.postal_code}</span>
                    </div>
                    <div>تلفن: {addr.phone}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr)}
                      className="text-xs text-muted hover:text-primary px-2 py-1 rounded hover:bg-primary/5 transition-colors"
                    >
                      پیش‌فرض
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(addr)}
                    className="p-1.5 text-muted hover:text-primary hover:bg-primary/5 rounded transition-colors"
                    title="ویرایش"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    disabled={deletingId === addr.id}
                    className="p-1.5 text-muted hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="حذف"
                  >
                    {deletingId === addr.id
                      ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <div id="addr-form" className="card p-5 border-2 border-primary/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-dark-2">{editId ? 'ویرایش آدرس' : 'افزودن آدرس جدید'}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-muted hover:text-dark-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-dark-2 mb-1">نام و نام خانوادگی <span className="text-red-500">*</span></label>
                <input
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  required
                  placeholder="نام گیرنده"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-2 mb-1">شماره تماس <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  required
                  placeholder="09xxxxxxxxx"
                  className="input-field w-full"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-2 mb-1">استان <span className="text-red-500">*</span></label>
                <select
                  value={form.province}
                  onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
                  required
                  className="input-field w-full bg-white"
                >
                  <option value="">انتخاب استان...</option>
                  {PROVINCE_CHOICES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-2 mb-1">شهر <span className="text-red-500">*</span></label>
                <input
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  required
                  placeholder="نام شهر"
                  className="input-field w-full"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-dark-2 mb-1">آدرس کامل <span className="text-red-500">*</span></label>
                <textarea
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  required
                  rows={2}
                  placeholder="خیابان، کوچه، پلاک..."
                  className="input-field w-full resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-2 mb-1">کد پستی <span className="text-red-500">*</span></label>
                <input
                  value={form.postal_code}
                  onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))}
                  required
                  placeholder="۱۰ رقم"
                  maxLength={10}
                  className="input-field w-full"
                  dir="ltr"
                />
              </div>
              <div className="flex items-center self-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-dark-2">
                  <input
                    type="checkbox"
                    checked={form.is_default}
                    onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
                    className="w-4 h-4 accent-primary"
                  />
                  تنظیم به عنوان آدرس پیش‌فرض
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                className="btn-secondary px-4 py-2 text-sm">
                انصراف
              </button>
              <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
                {saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    در حال ذخیره...
                  </>
                ) : editId ? 'ذخیره تغییرات' : 'افزودن آدرس'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
