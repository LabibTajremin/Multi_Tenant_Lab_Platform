import { getEnv } from './env';

/** This deployment's public origin. Reuses NEXTAUTH_URL — every tenant already
 * sets it to their canonical public URL — so SEO canonical links, Open Graph
 * URLs, the sitemap and robots.txt all resolve to absolute URLs without a new
 * env var. Trailing slash trimmed so callers can concatenate paths cleanly. */
export function getSiteUrl(): string {
  return getEnv().NEXTAUTH_URL.replace(/\/+$/, '');
}

/** Absolute URL for a site-relative path (e.g. `/research`). */
export function absoluteUrl(path = '/'): string {
  const base = getSiteUrl();
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}
