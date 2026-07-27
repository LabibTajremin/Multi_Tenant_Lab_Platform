import type { Metadata } from 'next';
import type { Tenant } from '@/domain/entities/Tenant';
import type { SiteSettings } from '@/domain/entities/SiteSettings';
import { getSiteUrl } from './siteUrl';

/** A sensible, non-empty description even before an Admin sets one — search
 * engines and social cards should never fall back to an empty string. */
export function resolveSiteDescription(tenant: Tenant, settings: SiteSettings | null): string {
  return (
    settings?.metaDescription?.trim() ||
    settings?.tagline?.trim() ||
    `${tenant.labName}${tenant.university ? ` — ${tenant.university}` : ''}. Research, people, publications and news.`
  );
}

/** Per-tenant metadata shared by the root layout. Individual pages can spread
 * this and override `title`. Kept framework-agnostic (returns a plain
 * Metadata object) so it's trivially unit-testable. */
export function buildSiteMetadata(tenant: Tenant, settings: SiteSettings | null): Metadata {
  const siteUrl = getSiteUrl();
  const description = resolveSiteDescription(tenant, settings);
  const ogImage = settings?.bannerUrl ?? tenant.logoUrl ?? undefined;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: tenant.labName,
      // Section pages render as "People · Lab Name" without repeating the
      // template themselves.
      template: `%s · ${tenant.labName}`,
    },
    description,
    applicationName: tenant.labName,
    alternates: { canonical: '/' },
    icons: tenant.logoUrl ? { icon: tenant.logoUrl } : undefined,
    openGraph: {
      type: 'website',
      siteName: tenant.labName,
      title: tenant.labName,
      description,
      url: siteUrl,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: tenant.labName,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

/** JSON-LD Organization block for the public site — helps search engines
 * understand the lab as an entity (name, logo, social profiles). */
export function buildOrganizationJsonLd(tenant: Tenant, settings: SiteSettings | null): string {
  const siteUrl = getSiteUrl();
  const sameAs = (settings?.socialLinks ?? []).map((l) => l.url).filter(Boolean);

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': tenant.university ? 'ResearchOrganization' : 'Organization',
    name: tenant.labName,
    url: siteUrl,
    ...(tenant.university ? { parentOrganization: tenant.university } : {}),
    ...(tenant.logoUrl ? { logo: tenant.logoUrl } : {}),
    ...(settings?.contactEmail ? { email: settings.contactEmail } : {}),
    description: resolveSiteDescription(tenant, settings),
    ...(sameAs.length ? { sameAs } : {}),
  });
}
