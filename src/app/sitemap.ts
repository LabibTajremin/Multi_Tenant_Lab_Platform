import type { MetadataRoute } from 'next';
import { SITE_NAV_LINKS } from '@/lib/siteNav';
import { absoluteUrl } from '@/lib/siteUrl';

// Read live per-deployment state; this build artifact is shared across tenants
// so the sitemap can never be statically baked at build time.
export const dynamic = 'force-dynamic';

/** Lists the home page plus every primary section so crawlers discover the
 * whole public site from one file. Content-level URLs (individual posts) are
 * reachable via these hub pages' internal links. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    ...SITE_NAV_LINKS.map((link) => ({
      url: absoluteUrl(link.href),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
