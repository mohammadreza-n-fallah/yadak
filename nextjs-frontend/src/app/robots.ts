import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://autoparts.ir';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/my-account/',
          '/checkout/',
          '/cart/',
          '/payment/',
          '/register/',
          '/login/',
          '/order-success/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
