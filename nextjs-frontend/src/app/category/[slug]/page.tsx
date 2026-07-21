import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import FilterSidebar from '@/components/shop/FilterSidebar';
import ProductGrid from '@/components/shop/ProductGrid';
import Breadcrumb from '@/components/ui/Breadcrumb';
import JsonLd from '@/components/seo/JsonLd';
import { SortSelector, Pagination } from '@/components/shop/ShopControls';
import { Category, Brand, PaginatedResponse, Product } from '@/types';
import { Suspense } from 'react';
import Spinner from '@/components/ui/Spinner';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://autoparts.ir';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

async function getCategory(slug: string): Promise<Category | null> {
  try {
    const r = await fetch(`http://127.0.0.1:8000/api/shop/categories/${slug}/`, { next: { revalidate: 300 } });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

async function getCategories(): Promise<Category[]> {
  try {
    const r = await fetch('http://127.0.0.1:8000/api/shop/categories/', { next: { revalidate: 300 } });
    const d = await r.json();
    return d.results || d;
  } catch { return []; }
}

async function getBrands(): Promise<Brand[]> {
  try {
    const r = await fetch('http://127.0.0.1:8000/api/shop/brands/', { next: { revalidate: 300 } });
    const d = await r.json();
    return d.results || d;
  } catch { return []; }
}

async function getProducts(categorySlug: string, sp: Record<string, string | undefined>): Promise<PaginatedResponse<Product>> {
  const params = new URLSearchParams({ category: categorySlug });
  if (sp.brand) params.set('brand', sp.brand);
  if (sp.min_price) params.set('min_price', sp.min_price);
  if (sp.max_price) params.set('max_price', sp.max_price);
  if (sp.badge) params.set('badge', sp.badge);
  if (sp.in_stock) params.set('in_stock', sp.in_stock);
  if (sp.page) params.set('page', sp.page);
  params.set('ordering', sp.ordering || '-created_at');
  try {
    const r = await fetch(`http://127.0.0.1:8000/api/shop/products/?${params}`, { cache: 'no-store' });
    if (!r.ok) return { count: 0, next: null, previous: null, results: [] };
    const data = await r.json();
    return { count: data.count ?? 0, next: data.next ?? null, previous: data.previous ?? null, results: data.results ?? [] };
  } catch { return { count: 0, next: null, previous: null, results: [] }; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategory(slug);
  if (!cat) return { title: 'دسته‌بندی' };
  const title = `خرید ${cat.name} | قطعات خودرو`;
  const description = cat.description
    ? cat.description.slice(0, 155)
    : `خرید انواع ${cat.name} با بهترین قیمت و ضمانت اصالت. ارسال سریع به سراسر ایران.`;
  return {
    title,
    description,
    keywords: [cat.name, 'قطعات خودرو', 'لوازم یدکی', cat.name + ' اصل'],
    openGraph: { title, description, type: 'website', url: `/category/${slug}` },
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const [category, categories, brands, productsData] = await Promise.all([
    getCategory(slug),
    getCategories(),
    getBrands(),
    getProducts(slug, sp),
  ]);

  if (!category) notFound();

  const page = +(sp.page || '1');
  const totalPages = Math.ceil(productsData.count / 10);

  // Build extra params string for Pagination (all current params except page)
  const extraParamsObj = { ...sp };
  delete extraParamsObj.page;
  const extraParams = new URLSearchParams(extraParamsObj as Record<string, string>).toString();

  const parentCat = category.parent ? categories.find(c => c.id === category.parent) : null;

  const breadcrumbItems = [
    { label: 'خانه', href: '/' },
    { label: 'فروشگاه', href: '/shop' },
    ...(parentCat ? [{ label: parentCat.name, href: `/category/${parentCat.slug}` }] : []),
    { label: category.name },
  ].filter(i => i.label);

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.label,
      ...(item.href && { item: `${SITE_URL}${item.href}` }),
    })),
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <JsonLd data={breadcrumbSchema} />
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex gap-6 mt-4">
        {/* Sidebar */}
        <div className="hidden md:block w-56 flex-shrink-0">
          <FilterSidebar
            categories={categories}
            brands={brands}
            currentCategory={slug}
            currentBrand={sp.brand}
            currentMinPrice={sp.min_price}
            currentMaxPrice={sp.max_price}
            currentBadge={sp.badge}
          />

          {/* Subcategories */}
          {category.children && category.children.length > 0 && (
            <div className="card p-4 mt-4">
              <h3 className="font-bold text-dark-2 text-sm mb-3">زیر دسته‌ها</h3>
              <div className="space-y-1">
                {category.children.map((child: Category) => (
                  <Link
                    key={child.id}
                    href={`/category/${child.slug}`}
                    className="flex items-center justify-between py-1.5 px-2 rounded text-sm text-dark-2 hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    <span>{child.name}</span>
                    <svg className="w-3 h-3 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header bar */}
          <div className="flex items-center justify-between mb-4 bg-white rounded-xl border border-border-color p-3 gap-3 flex-wrap">
            <div>
              <h1 className="font-bold text-dark-2 text-base">{category.name}</h1>
              <span className="text-xs text-muted">{productsData.count} محصول</span>
            </div>
            <SortSelector current={sp.ordering || '-created_at'} />
          </div>

          {/* Subcategories on mobile */}
          {category.children && category.children.length > 0 && (
            <div className="md:hidden flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-thin">
              {category.children.map((child: Category) => (
                <Link
                  key={child.id}
                  href={`/category/${child.slug}`}
                  className="flex-shrink-0 text-xs bg-white border border-border-color rounded-full px-3 py-1.5 hover:border-primary hover:text-primary transition-colors"
                >
                  {child.name}
                </Link>
              ))}
            </div>
          )}

          {!productsData.results?.length ? (
            <div className="text-center py-20 card p-10">
              <div className="text-5xl mb-4">🔍</div>
              <h2 className="font-bold text-dark-2 mb-2">محصولی یافت نشد</h2>
              <p className="text-sm text-muted mb-4">فیلترهای انتخابی را تغییر دهید یا به فروشگاه برگردید</p>
              <Link href="/shop" className="btn-primary inline-block px-6 text-sm">همه محصولات</Link>
            </div>
          ) : (
            <Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}>
              <ProductGrid products={productsData.results} />
            </Suspense>
          )}

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination current={page} total={totalPages} basePath={`/category/${slug}`} extraParams={extraParams} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
