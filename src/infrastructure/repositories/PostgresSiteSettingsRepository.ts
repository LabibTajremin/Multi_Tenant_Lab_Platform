import type { SiteSettings, SiteSocialLink } from '@/domain/entities/SiteSettings';
import type { ISiteSettingsRepository, SiteSettingsPatch } from '@/domain/repositories/ISiteSettingsRepository';
import type { PoolClient } from 'pg';
import { withTenantScope } from '../db/client';
import { idToLinkPlatform, linkPlatformToId } from '../db/lookupMaps';

interface SiteSettingsRow {
  tenant_id: string;
  banner_url: string | null;
  tagline: string | null;
  contact_email: string | null;
  updated_at: Date;
}

interface SocialLinkRow {
  platform_id: number;
  url: string;
}

async function fetchSocialLinks(client: PoolClient, tenantId: string): Promise<SiteSocialLink[]> {
  const result = await client.query<SocialLinkRow>(
    'SELECT platform_id, url FROM site_social_links WHERE tenant_id = $1',
    [tenantId],
  );
  return result.rows.map((row) => ({ platform: idToLinkPlatform(row.platform_id), url: row.url }));
}

function toEntity(row: SiteSettingsRow, socialLinks: SiteSocialLink[]): SiteSettings {
  return {
    tenantId: row.tenant_id,
    bannerUrl: row.banner_url,
    tagline: row.tagline,
    contactEmail: row.contact_email,
    socialLinks,
    updatedAt: row.updated_at,
  };
}

export class PostgresSiteSettingsRepository implements ISiteSettingsRepository {
  async getByTenant(tenantId: string): Promise<SiteSettings | null> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<SiteSettingsRow>('SELECT * FROM site_settings WHERE tenant_id = $1', [
        tenantId,
      ]);
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      const socialLinks = await fetchSocialLinks(client, tenantId);
      return toEntity(row, socialLinks);
    });
  }

  async upsert(tenantId: string, patch: SiteSettingsPatch): Promise<SiteSettings> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<SiteSettingsRow>(
        `INSERT INTO site_settings (tenant_id, banner_url, tagline, contact_email)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (tenant_id) DO UPDATE SET
           banner_url = COALESCE($2, site_settings.banner_url),
           tagline = COALESCE($3, site_settings.tagline),
           contact_email = COALESCE($4, site_settings.contact_email),
           updated_at = now()
         RETURNING *`,
        [tenantId, patch.bannerUrl ?? null, patch.tagline ?? null, patch.contactEmail ?? null],
      );
      const row = result.rows[0];
      if (!row) {
        throw new Error('Failed to upsert site settings');
      }
      const socialLinks = await fetchSocialLinks(client, tenantId);
      return toEntity(row, socialLinks);
    });
  }

  async setSocialLinks(tenantId: string, links: SiteSocialLink[]): Promise<void> {
    await withTenantScope(tenantId, async (client) => {
      await client.query('DELETE FROM site_social_links WHERE tenant_id = $1', [tenantId]);
      for (const link of links) {
        await client.query(
          'INSERT INTO site_social_links (tenant_id, platform_id, url) VALUES ($1, $2, $3)',
          [tenantId, linkPlatformToId(link.platform), link.url],
        );
      }
    });
  }
}
