import type { SiteSettings } from '@/domain/entities/SiteSettings';
import type { ISiteSettingsRepository } from '@/domain/repositories/ISiteSettingsRepository';
import type { LinkPlatform } from '@/domain/value-objects/LinkPlatform';
import { canChangeSiteSettings } from '@/lib/rbac';
import type { UseCaseContext } from '../../context';
import { updateSiteSettingsSchema } from '../../dtos/siteSettingsDtos';
import { PermissionError, ValidationError } from '../../errors';

export interface UpdateSiteSettingsDeps {
  repo: ISiteSettingsRepository;
}

/** Section 13 /admin/settings: Admin-only. */
export async function updateSiteSettings(
  input: unknown,
  ctx: UseCaseContext,
  deps: UpdateSiteSettingsDeps,
): Promise<SiteSettings> {
  if (!canChangeSiteSettings(ctx.actor)) {
    throw new PermissionError('Only an Admin can change site settings.');
  }

  const parsed = updateSiteSettingsSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError('Invalid site settings input', parsed.error.issues.map((i) => i.message));
  }

  const updated = await deps.repo.upsert(ctx.tenantId, {
    bannerUrl: parsed.data.bannerUrl,
    tagline: parsed.data.tagline,
    contactEmail: parsed.data.contactEmail,
  });

  if (parsed.data.socialLinks) {
    await deps.repo.setSocialLinks(
      ctx.tenantId,
      parsed.data.socialLinks.map((l) => ({ platform: l.platform as LinkPlatform, url: l.url })),
    );
  }

  return updated;
}
