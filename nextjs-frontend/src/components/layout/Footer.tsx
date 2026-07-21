'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { coreApi } from '@/lib/api';
import { SiteSettings } from '@/types';
import toast from 'react-hot-toast';

const DEFAULTS: Partial<SiteSettings> = {
  phone: '09015999055',
  email: 'info@autoparts.ir',
  address: 'خیابان ملت بازار چراغ برق',
  working_hours: 'شنبه تا چهارشنبه ۹–۱۸',
  instagram: '',
  telegram: '',
  whatsapp: '',
  footer_text: '',
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [settings, setSettings] = useState<Partial<SiteSettings>>(DEFAULTS);

  useEffect(() => {
    coreApi.settings()
      .then(r => setSettings({ ...DEFAULTS, ...r.data }))
      .catch(() => {});
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    try {
      const { data } = await coreApi.subscribe(email);
      toast.success(data.message || 'با موفقیت عضو خبرنامه شدید!');
      setEmail('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { email?: string[] } } }).response?.data?.email?.[0];
      toast.error(msg || 'خطا در عضویت در خبرنامه');
    } finally {
      setSubscribing(false);
    }
  };

  const hasSocials = settings.instagram || settings.telegram || settings.whatsapp;

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-gray-400 mt-16">
      {/* Green top accent */}
      <div className="h-1 bg-gradient-to-l from-primary-light via-primary to-primary-dark" />

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand + contact */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-base leading-none">یدک استوریج</h3>
                <p className="text-primary-light text-xs mt-0.5">قطعات خودرو</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed mb-5 text-gray-500">
              {settings.footer_text || 'بزرگ‌ترین فروشگاه آنلاین قطعات خودرو در ایران با بیش از ۵۰۰۰۰ قطعه یدکی اصل'}
            </p>

            <div className="space-y-2.5 text-sm">
              {settings.phone && (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <span>{settings.phone}</span>
                </div>
              )}
              {settings.email && (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span dir="ltr">{settings.email}</span>
                </div>
              )}
              {settings.address && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="leading-relaxed">{settings.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full inline-block" />
                اطلاعات
              </h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { href: '/about', label: 'درباره ما' },
                  { href: '/contact', label: 'تماس با ما' },
                  { href: '/track-order', label: 'پیگیری سفارش' },
                  { href: '/shop', label: 'همه محصولات' },
                  { href: '/blog', label: 'وبلاگ' },
                ].map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-primary-light transition-colors duration-150">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full inline-block" />
                حساب کاربری
              </h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { href: '/login', label: 'ورود' },
                  { href: '/register', label: 'ثبت‌نام' },
                  { href: '/my-account/orders', label: 'تاریخچه خرید' },
                  { href: '/wishlist', label: 'علاقه‌مندی‌ها' },
                  { href: '/cart', label: 'سبد خرید' },
                ].map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-primary-light transition-colors duration-150">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter + Socials */}
          <div>
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full inline-block" />
              خبرنامه
            </h4>
            <p className="text-sm mb-4 text-gray-500">برای دریافت جدیدترین تخفیف‌ها و محصولات ایمیل خود را وارد کنید</p>

            <form onSubmit={handleSubscribe}>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="آدرس ایمیل"
                  dir="ltr"
                  required
                  className="flex-1 bg-white/8 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 placeholder:text-gray-600 transition-all"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark active:scale-95 transition-all duration-200 disabled:opacity-60 flex-shrink-0 shadow-md shadow-primary/20"
                >
                  {subscribing ? '...' : 'عضویت'}
                </button>
              </div>
            </form>

            {/* Trust badges */}
            <div className="flex gap-3 mt-5 flex-wrap">
              {['ضمانت اصالت', 'ارسال سریع', 'پرداخت امن'].map(badge => (
                <span key={badge} className="flex items-center gap-1.5 text-xs bg-white/5 border border-white/10 text-gray-400 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  {badge}
                </span>
              ))}
            </div>

            {/* Social links */}
            {hasSocials && (
              <div className="flex gap-2 mt-5">
                {settings.instagram && (
                  <a href={settings.instagram} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 hover:bg-pink-500 hover:border-pink-500 flex items-center justify-center transition-all duration-200 hover:scale-110" title="اینستاگرام">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </a>
                )}
                {settings.telegram && (
                  <a href={settings.telegram} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 hover:bg-sky-500 hover:border-sky-500 flex items-center justify-center transition-all duration-200 hover:scale-110" title="تلگرام">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.324 14.12l-2.95-.924c-.642-.204-.655-.642.136-.953l11.532-4.448c.537-.194 1.006.131.52.453z" />
                    </svg>
                  </a>
                )}
                {settings.whatsapp && (
                  <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 hover:bg-green-500 hover:border-green-500 flex items-center justify-center transition-all duration-200 hover:scale-110" title="واتساپ">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>
                )}

 <a
      href="https://trustseal.enamad.ir/?id=753917&Code=PbncUJZpMwWsru8Pyd7s83ohGdwAtc5R"
      target="_blank"
      rel="noopener noreferrer"
      referrerPolicy="origin"
    >
      <img
        src="https://trustseal.enamad.ir/logo.aspx?id=753917&Code=PbncUJZpMwWsru8Pyd7s83ohGdwAtc5R"
        alt="Enamad Trust Seal"
        referrerPolicy="origin"
        style={{ cursor: "pointer" }}
        width={125}
        height={125}
      />
    </a>  

              </div>

            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5 py-4">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <span>© ۱۴۰۴ یدک استوریج — تمامی حقوق محفوظ است</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            <span>پرداخت امن با زرین‌پال</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
