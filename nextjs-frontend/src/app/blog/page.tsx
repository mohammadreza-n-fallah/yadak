import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Post, PaginatedResponse } from '@/types';
import { mediaUrl } from '@/lib/api';

export const metadata: Metadata = {
  title: 'وبلاگ قطعات خودرو | راهنما، مقاله و اخبار',
  description: 'آخرین مقالات، راهنماهای تعمیر و نگهداری، نقد و بررسی قطعات خودرو و اخبار صنعت خودرو ایران.',
  keywords: ['وبلاگ قطعات خودرو', 'راهنمای تعمیر خودرو', 'نگهداری خودرو', 'مقاله خودرو'],
  openGraph: { title: 'وبلاگ قطعات خودرو', description: 'آخرین مقالات، راهنماها و اخبار قطعات خودرو', type: 'website', url: '/blog' },
  alternates: { canonical: '/blog' },
};

interface SearchParams { page?: string; category?: string; search?: string }

async function getPosts(params: URLSearchParams): Promise<PaginatedResponse<Post>> {
  try {
    const r = await fetch(`http://localhost:8000/api/blog/?${params.toString()}`, { next: { revalidate: 60 } });
    if (!r.ok) return { count: 0, next: null, previous: null, results: [] };
    return r.json();
  } catch { return { count: 0, next: null, previous: null, results: [] }; }
}

async function getCategories(): Promise<{ id: number; name: string; slug: string }[]> {
  try {
    const r = await fetch('http://localhost:8000/api/blog/categories/', { next: { revalidate: 300 } });
    if (!r.ok) return [];
    return r.json();
  } catch { return []; }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function BlogPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const page = sp.page || '1';
  const category = sp.category || '';
  const search = sp.search || '';

  const params = new URLSearchParams();
  params.set('page', page);
  if (category) params.set('category__slug', category);
  if (search) params.set('search', search);

  const [data, categories] = await Promise.all([getPosts(params), getCategories()]);
  const totalPages = Math.ceil((data.count || 0) / 10);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="page-title">وبلاگ</h1>
        <p className="text-muted text-sm mt-1">آخرین مقالات، راهنماها و اخبار قطعات خودرو</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="md:w-56 flex-shrink-0 space-y-4">
          {/* Search */}
          <div className="card p-4">
            <form method="get">
              {category && <input type="hidden" name="category" value={category} />}
              <label className="block text-sm font-bold text-dark-2 mb-2">جستجو</label>
              <div className="flex gap-1">
                <input
                  name="search"
                  defaultValue={search}
                  placeholder="عنوان مطلب..."
                  className="input-field flex-1 text-sm py-1.5"
                />
                <button type="submit" className="btn-primary px-3 py-1.5 text-sm">🔍</button>
              </div>
            </form>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="card p-4">
              <h3 className="font-bold text-dark-2 text-sm mb-3">دسته‌بندی‌ها</h3>
              <ul className="space-y-1.5">
                <li>
                  <Link
                    href="/blog"
                    className={`block text-sm py-1 transition-colors ${!category ? 'text-primary font-semibold' : 'text-dark-2 hover:text-primary'}`}
                  >
                    همه مطالب
                    <span className="text-muted text-xs mr-1">({data.count})</span>
                  </Link>
                </li>
                {categories.map(cat => (
                  <li key={cat.id}>
                    <Link
                      href={`/blog?category=${cat.slug}`}
                      className={`block text-sm py-1 transition-colors ${category === cat.slug ? 'text-primary font-semibold' : 'text-dark-2 hover:text-primary'}`}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Main */}
        <div className="flex-1">
          {search && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm flex items-center justify-between">
              <span>نتایج جستجو برای: <strong>«{search}»</strong> — {data.count} مطلب</span>
              <Link href={category ? `/blog?category=${category}` : '/blog'} className="text-primary hover:underline text-xs">
                پاک کردن جستجو
              </Link>
            </div>
          )}

          {data.results.length === 0 ? (
            <div className="text-center py-20 card p-10">
              <div className="text-5xl mb-4">📰</div>
              <p className="font-semibold text-dark-2 mb-1">مطلبی یافت نشد</p>
              <Link href="/blog" className="text-primary text-sm hover:underline">مشاهده همه مطالب</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.results.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="card group overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                  {/* Image */}
                  <div className="relative h-44 bg-gray-100 overflow-hidden flex-shrink-0">
                    {post.image
                      ? <Image src={mediaUrl(post.image)} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="flex items-center justify-center h-full text-4xl text-gray-300">📰</div>}
                    {post.category_name && (
                      <span className="absolute top-2 right-2 text-xs text-primary bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full font-medium shadow-sm">
                        {post.category_name}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <h2 className="font-bold text-dark-2 mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-relaxed text-sm">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-xs text-muted line-clamp-2 leading-relaxed mb-3 flex-1">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted mt-auto pt-2 border-t border-border-color">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                        {post.author_name}
                      </span>
                      <span>{formatDate(post.published_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-1 mt-8">
              {+page > 1 && (
                <Link href={`/blog?page=${+page - 1}${category ? `&category=${category}` : ''}${search ? `&search=${search}` : ''}`}
                  className="w-9 h-9 rounded border border-border-color flex items-center justify-center text-sm hover:border-primary hover:text-primary">
                  ›
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Link
                  key={p}
                  href={`/blog?page=${p}${category ? `&category=${category}` : ''}${search ? `&search=${search}` : ''}`}
                  className={`w-9 h-9 rounded border flex items-center justify-center text-sm transition-colors ${
                    +page === p ? 'bg-primary text-white border-primary' : 'border-border-color hover:border-primary hover:text-primary'
                  }`}
                >
                  {p}
                </Link>
              ))}
              {+page < totalPages && (
                <Link href={`/blog?page=${+page + 1}${category ? `&category=${category}` : ''}${search ? `&search=${search}` : ''}`}
                  className="w-9 h-9 rounded border border-border-color flex items-center justify-center text-sm hover:border-primary hover:text-primary">
                  ‹
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
