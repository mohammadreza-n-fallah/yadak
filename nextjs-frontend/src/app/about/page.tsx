import { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://autoparts.ir';

export const metadata: Metadata = {
  title: 'درباره ما | یدک استوریج',
  description: 'فروشگاه قطعات خودرو با بیش از ۱۰ سال تجربه در حوزه فروش قطعات یدکی. ارائه قطعات اصل از برندهای معتبر با ضمانت اصالت و ارسال سریع.',
  keywords: ['درباره فروشگاه قطعات خودرو', 'فروشگاه قطعات یدکی', 'لوازم یدکی اصل'],
  openGraph: { title: 'درباره ما', description: 'آشنایی با فروشگاه قطعات خودرو و ارزش‌های ما', type: 'website', url: '/about' },
  alternates: { canonical: '/about' },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'AutoPartsStore',
  name: 'یدک استوریج',
  url: SITE_URL,
  description: 'فروشگاه آنلاین قطعات خودرو با بیش از ۱۰ سال تجربه و بیش از ۵۰۰۰۰ قطعه یدکی اصل',
  foundingDate: '2014',
  areaServed: { '@type': 'Country', name: 'Iran' },
  knowsLanguage: 'fa',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'قطعات خودرو',
    description: 'انواع قطعات یدکی اصل برای خودروهای ایرانی و خارجی',
  },
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <JsonLd data={organizationSchema} />

      <h1 className="page-title mb-6 text-center">درباره ما</h1>

      <div className="card p-8 space-y-6 text-dark-2 leading-loose">
        <section>
          <h2 className="text-xl font-bold mb-3 border-r-4 border-primary pr-3">فروشگاه قطعات خودرو</h2>
          <p className="text-muted">
            فروشگاه قطعات خودرو با بیش از ۱۰ سال تجربه در حوزه فروش قطعات یدکی خودرو، یکی از معتبرترین مجموعه‌های فعال در این صنعت محسوب می‌شود. ما با ارائه محصولات اصل و با کیفیت از برندهای معتبر جهانی، به مشتریان خود کمک می‌کنیم تا خودروی خود را در بهترین وضعیت نگه دارند.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">ارزش‌های ما</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: '✅', title: 'کیفیت', desc: 'تنها قطعات اصل و با کیفیت عرضه می‌کنیم' },
              { icon: '🤝', title: 'اعتماد', desc: 'شفافیت در قیمت‌گذاری و ضمانت اصالت' },
              { icon: '🚚', title: 'سرعت', desc: 'ارسال سریع به سراسر ایران' },
              { icon: '💬', title: 'پشتیبانی', desc: 'تیم متخصص آماده پاسخگویی شماست' },
            ].map(v => (
              <div key={v.title} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{v.icon}</span>
                <div>
                  <div className="font-semibold text-sm">{v.title}</div>
                  <div className="text-muted text-sm">{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">چرا ما را انتخاب کنید؟</h2>
          <ul className="space-y-2 text-muted text-sm">
            <li className="flex gap-2"><span className="text-green-500 mt-0.5">✓</span> بیش از ۵۰۰۰۰ قطعه در انبار</li>
            <li className="flex gap-2"><span className="text-green-500 mt-0.5">✓</span> گارانتی اصالت و ضمانت برگشت کالا</li>
            <li className="flex gap-2"><span className="text-green-500 mt-0.5">✓</span> ارسال رایگان برای خریدهای بالای ۵۰۰ هزار تومان</li>
            <li className="flex gap-2"><span className="text-green-500 mt-0.5">✓</span> پشتیبانی ۷ روز هفته</li>
            <li className="flex gap-2"><span className="text-green-500 mt-0.5">✓</span> پرداخت امن از طریق درگاه زرین‌پال</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
