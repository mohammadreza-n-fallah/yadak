import { Suspense } from 'react';
import { Metadata } from 'next';
import FilterSidebar from '@/components/shop/FilterSidebar';
import ProductGrid from '@/components/shop/ProductGrid';
import { SortSelector, Pagination } from '@/components/shop/ShopControls';
import { Product, Category, Brand, PaginatedResponse } from '@/types';

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const sp = await searchParams;
  const search = sp.search as string | undefined;
  const category = sp.category as string | undefined;
  const brand = sp.brand as string | undefined;

  let title = 'همه محصولات';
  let description = 'خرید آنلاین انواع قطعات خودرو با بهترین قیمت، ضمانت اصالت و ارسال سریع به سراسر ایران.';

  if (search) {
    title = `نتایج جستجو: ${search}`;
    description = `نتایج جستجو برای «${search}» در فروشگاه قطعات خودرو.`;
  } else if (category) {
    title = `قطعات خودرو - ${category}`;
  } else if (brand) {
    title = `قطعات برند ${brand}`;
    description = `خرید قطعات خودرو برند ${brand} با بهترین قیمت و ضمانت اصالت.`;
  }

  return {
    title,
    description,
    robots: search ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { title, description, type: 'website', url: '/shop' },
    alternates: { canonical: '/shop' },
  };
}

interface SearchParams { [key: string]: string | string[] | undefined }

async function getCategories(): Promise<Category[]> {
  try {
    const r = await fetch('http://127.0.0.1:8000/api/shop/categories/', { next: { revalidate: 300 } });
    const data = await r.json();
    return data.results || data;
  } catch { return []; }
}

async function getBrands(): Promise<Brand[]> {
  try {
    const r = await fetch('http://127.0.0.1:8000/api/shop/brands/', { next: { revalidate: 300 } });
    const data = await r.json();
    return data.results || data;
  } catch { return []; }
}

async function getProducts(params: URLSearchParams): Promise<PaginatedResponse<Product>> {
  try {
    const r = await fetch(`http://127.0.0.1:8000/api/shop/products/?${params.toString()}`, { cache: 'no-store' });
    return r.json();
  } catch { return { count: 0, next: null, previous: null, results: [] }; }
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const page = (sp.page as string) || '1';
  const ordering = (sp.ordering as string) || '-created_at';
  const category = sp.category as string;
  const brand = sp.brand as string;
  const min_price = sp.min_price as string;
  const max_price = sp.max_price as string;
  const badge = sp.badge as string;
  const search = sp.search as string;
  const trim = sp.trim as string;
  const in_stock = sp.in_stock as string;

  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (ordering) params.set('ordering', ordering);
  if (category) params.set('category', category);
  if (brand) params.set('brand', brand);
  if (min_price) params.set('min_price', min_price);
  if (max_price) params.set('max_price', max_price);
  if (badge) params.set('badge', badge);
  if (search) params.set('search', search);
  if (trim) params.set('compatible_vehicles', trim);
  if (in_stock === 'true') params.set('in_stock', 'true');

  const [categories, brands, productsData] = await Promise.all([
    getCategories(),
    getBrands(),
    getProducts(params),
  ]);

  const totalPages = Math.ceil(productsData.count / 12);

  const extraParams = new URLSearchParams();
  if (ordering) extraParams.set('ordering', ordering);
  if (category) extraParams.set('category', category);
  if (brand) extraParams.set('brand', brand);
  if (min_price) extraParams.set('min_price', min_price);
  if (max_price) extraParams.set('max_price', max_price);
  if (badge) extraParams.set('badge', badge);
  if (search) extraParams.set('search', search);
  if (trim) extraParams.set('trim', trim);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted mb-5 flex items-center gap-2">
        <a href="/" className="hover:text-primary transition-colors">خانه</a>
        <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-dark-2 font-medium">
          {search ? `جستجو: ${search}` : category || brand || 'همه محصولات'}
        </span>
      </nav>

      {/* Search results banner */}
      {search && (
        <div className="mb-5 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm text-blue-800">
            نتایج جستجو برای <span className="font-bold">«{search}»</span>
            <span className="text-blue-600 mr-2">— {productsData.count} محصول یافت شد</span>
          </p>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="hidden md:block w-60 flex-shrink-0">
          <Suspense fallback={<div className="space-y-3"><div className="card h-40 animate-pulse bg-gray-100" /><div className="card h-32 animate-pulse bg-gray-100" /></div>}>
            <FilterSidebar
              categories={categories}
              brands={brands}
              currentCategory={category}
              currentBrand={brand}
              currentMinPrice={min_price}
              currentMaxPrice={max_price}
              currentBadge={badge}
            />
          </Suspense>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Controls bar */}
          <div className="flex items-center justify-between mb-5 card px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-dark-2 tabular-nums">{productsData.count}</span>
              <span className="text-sm text-muted">محصول</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted hidden sm:block">مرتب‌سازی:</span>
              <Suspense fallback={null}>
                <SortSelector current={ordering} />
              </Suspense>
            </div>
          </div>

          <ProductGrid products={productsData.results} />

          {totalPages > 1 && (
            <Suspense fallback={null}>
              <Pagination current={+page} total={totalPages} basePath="/shop" extraParams={extraParams.toString()} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
