import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import VehicleFinder from '@/components/home/VehicleFinder';
import ProductCarousel from '@/components/home/ProductCarousel';
import JsonLd from '@/components/seo/JsonLd';
import { HomepageData, Category, Post } from '@/types';
import { mediaUrl, formatPrice } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://autoparts.ir';

export const metadata: Metadata = {
  title: 'یدک استوریج | خرید آنلاین لوازم یدکی اصل',
  description: 'بزرگ‌ترین فروشگاه آنلاین قطعات خودرو در ایران. خرید آسان لوازم یدکی اصل برای انواع خودروهای ایرانی و خارجی با ضمانت اصالت، قیمت مناسب و ارسال سریع.',
  openGraph: {
    title: 'یدک استوریج | خرید آنلاین لوازم یدکی اصل',
    description: 'بزرگ‌ترین فروشگاه آنلاین قطعات خودرو در ایران. خرید آسان لوازم یدکی اصل با ضمانت اصالت و ارسال سریع به سراسر کشور.',
    type: 'website',
    url: '/',
  },
  alternates: { canonical: '/' },
};

async function getHomepageData(): Promise<HomepageData | null> {
  try {
    const res = await fetch('http://localhost:8000/api/shop/', { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-border-color">
      <div className="text-primary flex-shrink-0">{icon}</div>
      <div>
        <div className="font-semibold text-dark-2 text-sm">{title}</div>
        <div className="text-xs text-muted mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

function CategoryCard({ cat }: { cat: Category }) {
  return (
    <Link href={`/category/${cat.slug}`}
      className="group bg-white rounded-lg border border-border-color p-4 flex flex-col items-center text-center hover:border-primary hover:shadow-md transition-all"
    >
      {cat.image
        ? <Image src={mediaUrl(cat.image)} alt={cat.name} width={80} height={80} className="object-contain mb-3 h-16" />
        : <div className="w-16 h-16 bg-gray-100 rounded-full mb-3 flex items-center justify-center text-2xl">🔧</div>}
      <span className="text-sm font-medium text-dark-2 group-hover:text-primary transition-colors">{cat.name}</span>
    </Link>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group card overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-44 bg-gray-100">
        {post.image
          ? <Image src={mediaUrl(post.image)} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="h-full bg-gray-200 flex items-center justify-center text-gray-400 text-3xl">📰</div>}
      </div>
      <div className="p-3">
        {post.category_name && <span className="text-xs text-primary">{post.category_name}</span>}
        <h3 className="font-semibold text-dark-2 text-sm mt-1 line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h3>
        {post.excerpt && <p className="text-xs text-muted mt-1 line-clamp-2">{post.excerpt}</p>}
        <div className="text-xs text-muted mt-2">{post.author_name}</div>
      </div>
    </Link>
  );
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'یدک استوریج',
  url: SITE_URL,
  description: 'فروشگاه آنلاین قطعات خودرو با بیش از ۵۰۰۰۰ قطعه یدکی اصل برای انواع خودروها',
  contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', availableLanguage: 'Persian' },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'یدک استوریج',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/shop?search={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};

export default async function HomePage() {
  const data = await getHomepageData();

  return (
    <div>
      <JsonLd data={organizationSchema} />
      <JsonLd data={websiteSchema} />
      <VehicleFinder />

      {/* Features strip */}
      <section className="bg-white border-b border-border-color">
        <div className="container mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <FeatureCard
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"/></svg>}
            title="ارسال سریع" desc="به سراسر ایران"
          />
          <FeatureCard
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            title="ضمانت اصالت" desc="قطعات ۱۰۰٪ اصل"
          />
          <FeatureCard
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>}
            title="پرداخت امن" desc="زرین‌پال"
          />
          <FeatureCard
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/></svg>}
            title="پشتیبانی" desc="۷ روز هفته"
          />
        </div>
      </section>

      {data ? (
        <>
          {/* New arrivals */}
          <ProductCarousel title="جدیدترین محصولات" products={data.new_arrivals} viewAllHref="/shop?ordering=-created_at" />

          {/* Sale */}
          {data.on_sale_products.length > 0 && (
            <section className="bg-white py-8 border-y border-border-color">
              <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-dark-2 border-r-4 border-primary pr-3">محصولات حراج</h2>
                  <Link href="/shop?on_sale=true" className="text-sm text-primary hover:underline">مشاهده همه</Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {data.on_sale_products.slice(0, 4).map(p => (
                    <Link key={p.id} href={`/product/${p.slug}`} className="card group overflow-hidden hover:shadow-md transition-shadow">
                      <div className="relative h-40 bg-gray-50">
                        {p.main_image && <Image src={mediaUrl(p.main_image.image)} alt={p.name} fill className="object-contain p-2 group-hover:scale-105 transition-transform duration-300" />}
                        <span className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded">%{p.discount_percent}</span>
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-medium line-clamp-1 group-hover:text-primary">{p.name}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-sm font-bold text-primary">{formatPrice(p.effective_price)}</span>
                          <span className="text-xs text-muted line-through">{formatPrice(p.price)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Categories */}
          {data.categories.length > 0 && (
            <section className="py-8">
              <div className="container mx-auto px-4">
                <h2 className="text-lg font-bold text-dark-2 border-r-4 border-primary pr-3 mb-4">دسته‌بندی‌ها</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {data.categories.map(cat => <CategoryCard key={cat.id} cat={cat} />)}
                </div>
              </div>
            </section>
          )}

          {/* Featured */}
          <ProductCarousel title="محصولات ویژه" products={data.featured_products} viewAllHref="/shop?featured=true" />

          {/* Banners */}
          {data.banners.length > 0 && (
            <section className="py-6">
              <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.banners.slice(0, 2).map(b => (
                  <Link key={b.id} href={b.link || '#'} className="relative h-36 rounded-xl overflow-hidden group block bg-gray-200">
                    {b.image && <Image src={mediaUrl(b.image)} alt={b.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />}
                    <div className="absolute inset-0 bg-black/40 flex flex-col justify-center p-6">
                      <h3 className="text-white font-bold text-lg">{b.title}</h3>
                      {b.subtitle && <p className="text-gray-200 text-sm">{b.subtitle}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Blog */}
          {data.recent_posts.length > 0 && (
            <section className="py-8 bg-white border-t border-border-color">
              <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-dark-2 border-r-4 border-primary pr-3">آخرین مطالب</h2>
                  <Link href="/blog" className="text-sm text-primary hover:underline">مشاهده همه</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {data.recent_posts.map(p => <PostCard key={p.id} post={p} />)}
                </div>
              </div>
            </section>
          )}

          {/* Brands */}
          {data.brands.length > 0 && (
            <section className="py-8">
              <div className="container mx-auto px-4">
                <h2 className="text-lg font-bold text-dark-2 border-r-4 border-primary pr-3 mb-4">برندها</h2>
                <div className="flex flex-wrap gap-4 justify-center">
                  {data.brands.map(b => (
                    <Link key={b.id} href={`/shop?brand=${b.slug}`} className="h-16 px-6 border border-border-color rounded-lg flex items-center justify-center hover:border-primary hover:shadow-sm transition-all bg-white">
                      {b.logo
                        ? <Image src={mediaUrl(b.logo)} alt={b.name} width={80} height={40} className="object-contain" />
                        : <span className="text-sm font-medium text-dark-2">{b.name}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="container mx-auto px-4 py-20 text-center text-muted">
          <p className="text-lg mb-2">خطا در اتصال به سرور</p>
          <p className="text-sm">لطفاً مطمئن شوید Django backend روی پورت ۸۰۰۰ در حال اجرا است.</p>
          <p className="text-xs mt-2 font-mono">cd backend && python manage.py runserver</p>
        </div>
      )}
    </div>
  );
}
