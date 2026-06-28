'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { cartApi, authApi, formatPrice, mediaUrl } from '@/lib/api';
import { Address } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

interface AddressForm {
  full_name: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postal_code: string;
}

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

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading: cartLoading, fetchCart } = useCartStore();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [form, setForm] = useState<AddressForm>({
    full_name: '',
    phone: '',
    province: '',
    city: '',
    address: '',
    postal_code: '',
  });
  const [note, setNote] = useState('');

  useEffect(() => { fetchCart(); }, []);

  // Load saved addresses
  useEffect(() => {
    if (isAuthenticated) {
      authApi.addresses().then(r => {
        const addrs: Address[] = r.data.results ?? r.data;
        setSavedAddresses(addrs);
        // Pre-select default address
        const def = addrs.find(a => a.is_default) || addrs[0];
        if (def) fillFromAddress(def);
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  // Pre-fill name/phone from user data
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        full_name: f.full_name || `${user.first_name} ${user.last_name}`.trim(),
        phone: f.phone || user.phone || '',
      }));
    }
  }, [user]);

  // Auth guard
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) router.replace('/login');
  }, [_hasHydrated, isAuthenticated]);

  const fillFromAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
    setForm({
      full_name: addr.full_name,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      address: addr.address,
      postal_code: addr.postal_code,
    });
  };

  const updateField = (k: keyof AddressForm, v: string) => {
    setSelectedAddressId(null);
    setForm(f => ({ ...f, [k]: v }));
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.phone || !form.province || !form.city || !form.address || !form.postal_code) {
      toast.error('لطفاً تمام فیلدهای اجباری را تکمیل کنید');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, note };
      const { data } = await cartApi.checkout(payload);
      if (data.pay_url) {
        toast.success('در حال انتقال به درگاه پرداخت...');
        window.location.href = data.pay_url;
      } else {
        toast.success('سفارش با موفقیت ثبت شد');
        router.push(`/order-success?order=${data.order?.order_number || ''}`);
      }
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: Record<string, unknown> } }).response?.data;
      const msg = (errData?.detail || errData?.error) as string | undefined;
      toast.error(msg || 'خطا در ثبت سفارش. لطفاً دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!_hasHydrated || cartLoading) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  if (!isAuthenticated) return null;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🛒</div>
        <h1 className="text-xl font-bold text-dark-2 mb-2">سبد خرید شما خالی است</h1>
        <p className="text-muted mb-6">برای تکمیل خرید ابتدا محصولاتی به سبد اضافه کنید</p>
        <Link href="/shop" className="btn-primary inline-block px-8">رفتن به فروشگاه</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <nav className="text-sm text-muted mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-primary">خانه</Link>
        <span>/</span>
        <Link href="/cart" className="hover:text-primary">سبد خرید</Link>
        <span>/</span>
        <span className="text-dark-2">تکمیل خرید</span>
      </nav>
      <h1 className="page-title mb-6">تکمیل خرید</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Shipping form */}
        <div className="flex-1">
          <form onSubmit={handleOrder} className="space-y-4">
            <div className="card p-5">
              <h2 className="font-bold text-dark-2 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">۱</span>
                اطلاعات تحویل
              </h2>

              {/* Saved addresses */}
              {savedAddresses.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-dark-2 mb-2">انتخاب از آدرس‌های ذخیره شده:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {savedAddresses.map(addr => (
                      <label key={addr.id} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-border-color hover:border-primary/40'}`}>
                        <input
                          type="radio"
                          name="saved_address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => fillFromAddress(addr)}
                          className="accent-primary mt-0.5 flex-shrink-0"
                        />
                        <div className="text-xs leading-relaxed">
                          <div className="font-semibold text-dark-2 mb-0.5">{addr.full_name}</div>
                          <div className="text-muted">{addr.address}</div>
                          <div className="text-muted">{provinceLabel(addr.province)} — {addr.city} — کد پستی: {addr.postal_code}</div>
                          {addr.is_default && <span className="inline-block mt-1 bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded">پیش‌فرض</span>}
                        </div>
                      </label>
                    ))}
                    <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${selectedAddressId === null && savedAddresses.length > 0 ? 'border-primary bg-primary/5' : 'border-border-color hover:border-primary/40'}`}>
                      <input
                        type="radio"
                        name="saved_address"
                        checked={selectedAddressId === null}
                        onChange={() => { setSelectedAddressId(null); setForm({ full_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(), phone: user?.phone || '', province: '', city: '', address: '', postal_code: '' }); }}
                        className="accent-primary flex-shrink-0"
                      />
                      <span className="text-xs text-dark-2 font-medium">+ وارد کردن آدرس جدید</span>
                    </label>
                  </div>
                  <hr className="my-4" />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-2 mb-1">نام و نام خانوادگی <span className="text-red-500">*</span></label>
                  <input
                    value={form.full_name}
                    onChange={e => updateField('full_name', e.target.value)}
                    required
                    placeholder="نام کامل گیرنده"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-2 mb-1">شماره موبایل <span className="text-red-500">*</span></label>
                  <input
                    value={form.phone}
                    onChange={e => updateField('phone', e.target.value)}
                    required
                    type="tel"
                    placeholder="09xxxxxxxxx"
                    className="input-field w-full"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-2 mb-1">استان <span className="text-red-500">*</span></label>
                  <select
                    value={form.province}
                    onChange={e => updateField('province', e.target.value)}
                    required
                    className="input-field w-full bg-white"
                  >
                    <option value="" disabled>انتخاب استان...</option>
                    {PROVINCE_CHOICES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-2 mb-1">شهر <span className="text-red-500">*</span></label>
                  <input
                    value={form.city}
                    onChange={e => updateField('city', e.target.value)}
                    required
                    placeholder="نام شهر"
                    className="input-field w-full"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-dark-2 mb-1">آدرس کامل <span className="text-red-500">*</span></label>
                  <textarea
                    value={form.address}
                    onChange={e => updateField('address', e.target.value)}
                    required
                    rows={2}
                    placeholder="خیابان، کوچه، پلاک، واحد"
                    className="input-field w-full resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-2 mb-1">کد پستی <span className="text-red-500">*</span></label>
                  <input
                    value={form.postal_code}
                    onChange={e => updateField('postal_code', e.target.value)}
                    required
                    placeholder="۱۰ رقم"
                    className="input-field w-full"
                    maxLength={10}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-2 mb-1">توضیحات سفارش</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={2}
                    placeholder="نکته‌ای برای پیک یا فروشگاه؟ (اختیاری)"
                    className="input-field w-full resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="card p-5">
              <h2 className="font-bold text-dark-2 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">۲</span>
                روش پرداخت
              </h2>
              <label className="flex items-center gap-3 p-4 border-2 border-primary rounded-xl bg-primary/5 cursor-pointer">
                <input type="radio" checked readOnly className="accent-primary w-4 h-4" />
                <div className="flex-1">
                  <div className="font-semibold text-dark-2 text-sm">پرداخت آنلاین (زرین‌پال)</div>
                  <div className="text-xs text-muted mt-0.5">کلیه کارت‌های عضو شتاب — ایمن و سریع</div>
                </div>
                <div className="text-2xl">💳</div>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-4 font-bold text-base flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  در حال پردازش...
                </>
              ) : (
                <>پرداخت و تأیید سفارش — {formatPrice(cart.total_price)}</>
              )}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="card p-4 sticky top-24">
            <h2 className="font-bold text-dark-2 mb-3 text-sm border-b border-border-color pb-3">
              سبد خرید ({cart.total_items} کالا)
            </h2>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {cart.items.map(item => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative w-14 h-14 flex-shrink-0 rounded-lg bg-gray-50 border border-border-color overflow-hidden">
                    {item.product.main_image
                      ? <Image src={mediaUrl(item.product.main_image.image)} alt={item.product.name} fill className="object-contain p-1" />
                      : <span className="flex items-center justify-center h-full text-xl">🔧</span>}
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="line-clamp-2 text-dark-2 text-xs font-medium leading-relaxed">{item.product.name}</div>
                    <div className="text-primary font-bold text-xs mt-1">{formatPrice(item.subtotal)}</div>
                  </div>
                </div>
              ))}
            </div>
            <hr className="mb-3" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">جمع کالاها</span>
                <span className="font-medium">{formatPrice(cart.total_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">هزینه ارسال</span>
                <span className="text-green-600 font-medium">رایگان</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold text-base">
                <span>مبلغ نهایی</span>
                <span className="text-primary">{formatPrice(cart.total_price)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
