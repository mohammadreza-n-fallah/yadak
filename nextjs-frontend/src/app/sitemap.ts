import { MetadataRoute } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://autoparts.ir';

interface PagedResponse<T> { items: T[]; nextUrl: string | null }

async function fetchPage<T>(url: string): Promise<PagedResponse<T>> {
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return { items: [], nextUrl: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await r.json() as any;
    if (Array.isArray(data)) return { items: data as T[], nextUrl: null };
    return { items: (data.results || []) as T[], nextUrl: (data.next as string | null) || null };
  } catch { return { items: [], nextUrl: null }; }
}

async function fetchAll<T>(endpoint: string): Promise<T[]> {
  const all: T[] = [];
  let currentUrl: string | null = `${API_BASE}${endpoint}`;
  while (currentUrl) {
    const page: PagedResponse<T> = await fetchPage<T>(currentUrl);
    all.push(...page.items);
    currentUrl = page.nextUrl;
    if (!page.items.length) break;
  }
  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, posts] = await Promise.all([
    fetchAll<{ slug: string; updated_at?: string }>('/api/shop/products/?page_size=500'),
    fetchAll<{ slug: string }>('/api/shop/categories/'),
    fetchAll<{ slug: string; published_at?: string }>('/api/blog/?page_size=500'),
  ]);

  const now = new Date();

  const statics: MetadataRoute.Sitemap = [
    { url: SITE_URL,                    lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/shop`,          lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/blog`,          lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${SITE_URL}/about`,         lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contact`,       lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/track-order`,   lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  return [
    ...statics,
    ...products.map(p => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...categories.map(c => ({
      url: `${SITE_URL}/category/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...posts.map(p => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.published_at ? new Date(p.published_at) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
