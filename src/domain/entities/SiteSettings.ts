import type { LinkPlatform } from '../value-objects/LinkPlatform';

export interface SiteSocialLink {
  platform: LinkPlatform;
  url: string;
}

export interface SiteSettings {
  tenantId: string;
  bannerUrl: string | null;
  tagline: string | null;
  contactEmail: string | null;
  /** SEO summary used for <meta name="description"> and Open Graph. */
  metaDescription: string | null;
  /** Whether the primary nav menu is mirrored in the site footer. */
  footerNavEnabled: boolean;
  socialLinks: SiteSocialLink[];
  updatedAt: Date;
}
