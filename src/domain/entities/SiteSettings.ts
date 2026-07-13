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
  socialLinks: SiteSocialLink[];
  updatedAt: Date;
}
