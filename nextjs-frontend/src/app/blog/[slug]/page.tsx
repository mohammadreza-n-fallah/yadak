import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import JsonLd from '@/components/seo/JsonLd';
import { PostDetail } from '@/types';
import { mediaUrl } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://autoparts.ir';

async function getPost(slug: string): Promise<PostDetail | null> {
  try {
    const r = await fetch(`http://127.0.0.1:8000/api/blog/${slug}/`, { next: { revalidate: 60 } });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'مطلب یافت نشد' };

  const title = post.title;
  const description = post.excerpt?.slice(0, 155) || post.title;
  const imageUrl = post.image ? mediaUrl(post.image) : undefined;

  return {
    title,
    description,
    keywords: [post.title, post.category_name, 'وبلاگ قطعات خودرو', 'راهنمای خودرو'].filter(Boolean) as string[],
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/blog/${slug}`,
      publishedTime: post.published_at || undefined,
      authors: [post.author_name],
      ...(imageUrl && { images: [{ url: imageUrl, alt: title }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
    alternates: { canonical: `/blog/${slug}` },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const imageUrl = post.image ? mediaUrl(post.image) : undefined;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.title,
    ...(imageUrl && { image: imageUrl }),
    author: { '@type': 'Person', name: post.author_name },
    publisher: {
      '@type': 'Organization',
      name: 'یدک استوریج',
      url: SITE_URL,
    },
    datePublished: post.published_at || undefined,
    dateModified: post.published_at || undefined,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${slug}` },
    ...(post.category_name && { articleSection: post.category_name }),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'خانه', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'وبلاگ', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />

      <Breadcrumb items={[{ label: 'خانه', href: '/' }, { label: 'وبلاگ', href: '/blog' }, { label: post.title }]} />

      <article className="mt-4">
        {post.image && (
          <div className="relative h-64 md:h-96 rounded-xl overflow-hidden mb-6 bg-gray-100">
            <Image src={mediaUrl(post.image)} alt={post.title} fill className="object-cover" />
          </div>
        )}

        <div className="flex items-center gap-3 text-sm text-muted mb-4">
          {post.category_name && (
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{post.category_name}</span>
          )}
          <span>{post.author_name}</span>
          {post.published_at && <span>{new Date(post.published_at).toLocaleDateString('fa-IR')}</span>}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-dark-2 mb-4 leading-tight">{post.title}</h1>

        {post.excerpt && (
          <p className="text-muted text-base leading-relaxed mb-6 border-r-4 border-primary pr-4 italic">{post.excerpt}</p>
        )}

        <div
          className="prose prose-sm max-w-none text-dark-2 leading-loose"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />
      </article>
    </div>
  );
}
