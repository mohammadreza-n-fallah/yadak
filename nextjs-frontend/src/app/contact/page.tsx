import { Metadata } from 'next';
import Link from 'next/link';
import { SiteSettings } from '@/types';
import ContactForm from './ContactForm';
import JsonLd from '@/components/seo/JsonLd';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://autoparts.ir';

export const metadata: Metadata = {
  title: 'تماس با ما | یدک استوریج',
  description: 'با فروشگاه قطعات خودرو تماس بگیرید. پشتیبانی ۷ روز هفته، پاسخگوی سوالات شما در خرید قطعات یدکی اصل.',
  keywords: ['تماس با فروشگاه قطعات خودرو', 'پشتیبانی قطعات خودرو', 'شماره تلفن فروشگاه'],
  openGraph: { title: 'تماس با ما', description: 'راه‌های تماس با فروشگاه قطعات خودرو', type: 'website', url: '/contact' },
  alternates: { canonical: '/contact' },
};

async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const r = await fetch('http://localhost:8000/api/settings/', { next: { revalidate: 3600 } });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

const FALLBACK: Partial<SiteSettings> = {
  phone: '۰۲۱-۱۲۳۴۵۶۷۸',
  email: 'info@autoparts.ir',
  address: 'تهران، خیابان ملت، پلاک ۱۰',
  working_hours: 'شنبه تا چهارشنبه ۹:۰۰–۱۸:۰۰',
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const s = { ...FALLBACK, ...settings };

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'AutoPartsStore',
    name: s.site_name || 'یدک استوریج',
    url: SITE_URL,
    ...(s.phone && { telephone: s.phone }),
    ...(s.email && { email: s.email }),
    ...(s.address && { address: { '@type': 'PostalAddress', streetAddress: s.address, addressCountry: 'IR' } }),
    ...(s.working_hours && { openingHours: s.working_hours }),
    priceRange: '﷼﷼',
    areaServed: { '@type': 'Country', name: 'Iran' },
  };

  const contactItems = [
    ...(s.phone ? [{ icon: '📞', title: 'تلفن', body: s.phone }] : []),
    ...(s.email ? [{ icon: '✉️', title: 'ایمیل', body: s.email }] : []),
    ...(s.address ? [{ icon: '📍', title: 'آدرس', body: s.address }] : []),
    ...(s.working_hours ? [{ icon: '🕐', title: 'ساعات کاری', body: s.working_hours }] : []),
  ];

  const hasSocials = s.instagram || s.telegram || s.whatsapp;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <JsonLd data={localBusinessSchema} />
      {/* Breadcrumb */}
      <nav className="text-sm text-muted mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-primary">خانه</Link>
        <span>/</span>
        <span className="text-dark-2">تماس با ما</span>
      </nav>

      <h1 className="page-title mb-2 text-center">تماس با ما</h1>
      <p className="text-center text-muted text-sm mb-8">سوال یا پیشنهادی دارید؟ با ما در تماس باشید.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact info sidebar */}
        <div className="space-y-4">
          {/* Info cards */}
          <div className="card p-5 space-y-4">
            {contactItems.map(item => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <div className="font-semibold text-dark-2 text-sm mb-0.5">{item.title}</div>
                  <div className="text-muted text-sm leading-relaxed">{item.body}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Social links */}
          {hasSocials && (
            <div className="card p-4">
              <h3 className="font-semibold text-dark-2 text-sm mb-3">شبکه‌های اجتماعی</h3>
              <div className="flex gap-2">
                {s.instagram && (
                  <a href={s.instagram} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center hover:opacity-90 transition-opacity"
                    title="اینستاگرام">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                  </a>
                )}
                {s.telegram && (
                  <a href={s.telegram} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors"
                    title="تلگرام">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.324 14.12l-2.95-.924c-.642-.204-.655-.642.136-.953l11.532-4.448c.537-.194 1.006.131.52.453z"/>
                    </svg>
                  </a>
                )}
                {s.whatsapp && (
                  <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors"
                    title="واتساپ">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="card p-4">
            <h3 className="font-semibold text-dark-2 text-sm mb-3">لینک‌های مفید</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/track-order" className="text-primary hover:underline">پیگیری سفارش</Link></li>
              <li><Link href="/shop" className="text-primary hover:underline">فروشگاه</Link></li>
              <li><Link href="/blog" className="text-primary hover:underline">وبلاگ و راهنماها</Link></li>
            </ul>
          </div>
        </div>

        {/* Form */}
        <div className="md:col-span-2">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
