import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Rating from '@/components/ui/Rating';
import ProductActions from './ProductActions';
import ProductTabs from './ProductTabs';
import ImageGallery from './ImageGallery';
import JsonLd from '@/components/seo/JsonLd';
import { Product } from '@/types';
import { formatPrice, mediaUrl } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://autoparts.ir';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const r = await fetch(`http://127.0.0.1:8000/api/shop/products/${slug}/`, { next: { revalidate: 60 } });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: 'محصول یافت نشد' };

  const title = `خرید ${p.name}${p.brand_name ? ` - ${p.brand_name}` : ''}`;
  const rawDesc = p.short_description || (p.description ? stripHtml(p.description) : '');
  const description = rawDesc.slice(0, 155) || `خرید ${p.name} با بهترین قیمت و ضمانت اصالت از فروشگاه قطعات خودرو`;
  const imageUrl = p.main_image?.image ? mediaUrl(p.main_image.image) : undefined;
  const keywords = [p.name, p.brand_name, p.category_name, p.part_number, 'قطعات خودرو', 'لوازم یدکی'].filter(Boolean) as string[];

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/product/${slug}`,
      ...(imageUrl && { images: [{ url: imageUrl, alt: p.name, width: 800, height: 800 }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
    alternates: { canonical: `/product/${slug}` },
  };
}

const BADGE_STYLES: Record<string, string> = {
  sale: 'bg-rose-500 text-white',
  new: 'bg-blue-500 text-white',
  hot: 'bg-orange-500 text-white',
  original: 'bg-primary text-white',
};

const BADGE_LABELS: Record<string, string> = { new: 'جدید', sale: 'حراج', original: 'اصلی', hot: 'پرفروش' };

const TRUST_ITEMS = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    title: 'ارسال سریع',
    sub: 'به سراسر ایران',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'ضمانت اصالت',
    sub: '۱۰۰٪ اصل',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    title: 'پشتیبانی',
    sub: '۷ روز هفته',
  },
];

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const images = product.images?.length
    ? product.images
    : (product.main_image ? [product.main_image] : []);

  const allImageUrls = images.map(img => mediaUrl(img.image));

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ? stripHtml(product.description) : product.name,
    sku: product.part_number || undefined,
    ...(product.brand_name && { brand: { '@type': 'Brand', name: product.brand_name } }),
    ...(allImageUrls.length > 0 && { image: allImageUrls }),
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: 'IRR',
      price: product.effective_price,
      availability: product.is_in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'یدک استوریج' },
    },
    ...(product.review_count > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.average_rating,
        reviewCount: product.review_count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  const breadcrumbItems = [
    { label: 'خانه', href: '/' },
    { label: 'فروشگاه', href: '/shop' },
    ...(product.category_name && product.category_slug
      ? [{ label: product.category_name, href: `/category/${product.category_slug}` }]
      : []),
    { label: product.name },
  ];

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
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />

      <Breadcrumb items={breadcrumbItems} />

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image gallery */}
        <ImageGallery images={images} name={product.name} />

        {/* Product info */}
        <div className="space-y-5">
          {/* Badge */}
          {product.badge && BADGE_LABELS[product.badge] && (
            <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full ${BADGE_STYLES[product.badge] || 'bg-gray-200 text-dark-2'}`}>
              {BADGE_LABELS[product.badge]}
            </span>
          )}

          <h1 className="text-xl md:text-2xl font-bold text-dark-2 leading-snug">{product.name}</h1>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-2 text-sm">
            {product.brand_name && (
              <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-xl">
                <svg className="w-3.5 h-3.5 text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="text-muted text-xs">برند:</span>
                <span className="font-semibold text-dark-2 text-xs">{product.brand_name}</span>
              </div>
            )}
            {product.part_number && (
              <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-xl">
                <svg className="w-3.5 h-3.5 text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-muted text-xs">کد قطعه:</span>
                <span className="font-mono font-semibold text-dark-2 text-xs">{product.part_number}</span>
              </div>
            )}
          </div>

          {/* Rating */}
          {product.review_count > 0 && (
            <div className="flex items-center gap-2">
              <Rating value={product.average_rating} readOnly />
              <span className="text-sm text-muted">({product.review_count} نظر)</span>
            </div>
          )}

          {/* Price */}
          <div className="py-4 border-y border-border-color">
            {product.sale_price ? (
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl font-bold text-primary">{formatPrice(product.effective_price)}</span>
                <span className="text-lg text-muted line-through">{formatPrice(product.price)}</span>
                <span className="badge-sale">٪{product.discount_percent} تخفیف</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-primary">{formatPrice(product.price)}</span>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className={`w-2.5 h-2.5 rounded-full ${product.is_in_stock ? 'bg-green-500' : 'bg-red-400'}`} />
            <span className={product.is_in_stock ? 'text-green-700' : 'text-red-500'}>
              {product.is_in_stock
                ? `موجود در انبار${product.stock ? ` — ${product.stock} عدد` : ''}`
                : 'ناموجود'}
            </span>
          </div>

          {/* Add to cart / wishlist */}
          <ProductActions product={product} />

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 py-4 border-t border-border-color">
            {TRUST_ITEMS.map(item => (
              <div key={item.title} className="text-center">
                <div className="w-10 h-10 mx-auto bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-1.5">
                  {item.icon}
                </div>
                <div className="text-xs font-semibold text-dark-2">{item.title}</div>
                <div className="text-[10px] text-muted mt-0.5">{item.sub}</div>
              </div>
            ))}
          </div>

          {/* Compatible vehicles */}
          {product.compatible_vehicles && product.compatible_vehicles.length > 0 && (
            <div className="border border-border-color rounded-2xl p-4">
              <h3 className="font-semibold text-sm text-dark-2 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2-2h8zm0 0l2-2h3l2-5H13" />
                </svg>
                خودروهای سازگار
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {product.compatible_vehicles.map(v => (
                  <span key={v.id} className="text-xs bg-gray-100 text-dark-2 px-3 py-1 rounded-full">{v.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabbed: description + reviews */}
      <ProductTabs product={product} />
    </div>
  );
}
