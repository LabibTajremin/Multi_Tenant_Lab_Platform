import type { SiteSettings, SiteSocialLink } from '../entities/SiteSettings';

export interface SiteSettingsPatch {
  bannerUrl?: string | null;
  tagline?: string | null;
  contactEmail?: string | null;
}

export interface ISiteSettingsRepository {
  getByTenant(tenantId: string): Promise<SiteSettings | null>;
  upsert(tenantId: string, patch: SiteSettingsPatch): Promise<SiteSettings>;
  setSocialLinks(tenantId: string, links: SiteSocialLink[]): Promise<void>;
}
