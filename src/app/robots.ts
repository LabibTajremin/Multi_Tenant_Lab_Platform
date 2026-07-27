import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

/** Allow crawling of the public site, keep the admin panel and auth routes out
 * of the index, and point crawlers at the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/login', '/reset-password', '/setup'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
