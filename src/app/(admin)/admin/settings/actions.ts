'use server';

import { revalidatePath } from 'next/cache';
import { PostgresTenantRepository } from '@/infrastructure/repositories/PostgresTenantRepository';
import { PostgresSiteSettingsRepository } from '@/infrastructure/repositories/PostgresSiteSettingsRepository';
import { updateSiteSettings } from '@/application/use-cases/settings/UpdateSiteSettings';
import { toggleReviewMode } from '@/application/use-cases/settings/ToggleReviewMode';
import { getUseCaseContext } from '@/lib/useCaseContext';
import { toFormState, type FormState } from '@/lib/formState';
import { canChangeSiteSettings } from '@/lib/rbac';
import { PermissionError } from '@/application/errors';
import { LINK_PLATFORMS } from '@/domain/value-objects/LinkPlatform';
import type { LinkPlatform } from '@/domain/value-objects/LinkPlatform';

export async function updateSettingsAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    const ctx = await getUseCaseContext();
    if (!canChangeSiteSettings(ctx.actor)) {
      throw new PermissionError('Only an Admin can change site settings.');
    }

    const tenantRepo = new PostgresTenantRepository();
    const siteSettingsRepo = new PostgresSiteSettingsRepository();

    const labName = String(formData.get('labName') ?? '').trim();
    const university = String(formData.get('university') ?? '').trim();
    const primaryColor = String(formData.get('primaryColor') ?? '');
    const backgroundPattern = String(formData.get('backgroundPattern') ?? '');
    const logoUrl = String(formData.get('logoUrl') ?? '').trim();

    if (labName) {
      await tenantRepo.update(ctx.tenantId, {
        labName,
        university: university || null,
        primaryColor: primaryColor || null,
        backgroundPattern: backgroundPattern || undefined,
        logoUrl: logoUrl || null,
      });
    }

    const socialLinks: { platform: LinkPlatform; url: string }[] = LINK_PLATFORMS.map((platform) => ({
      platform,
      url: String(formData.get(`link_${platform}`) ?? '').trim(),
    })).filter((l) => l.url.length > 0);

    await updateSiteSettings(
      {
        bannerUrl: String(formData.get('bannerUrl') ?? '') || undefined,
        tagline: String(formData.get('tagline') ?? '') || undefined,
        contactEmail: String(formData.get('contactEmail') ?? '') || undefined,
        socialLinks,
      },
      ctx,
      { repo: siteSettingsRepo },
    );
  } catch (error) {
    return toFormState(error);
  }
  revalidatePath('/admin/settings');
  return {};
}

export async function toggleReviewModeAction(enabled: boolean): Promise<void> {
  const ctx = await getUseCaseContext();
  const repo = new PostgresTenantRepository();
  await toggleReviewMode(enabled, ctx, { repo });
  revalidatePath('/admin/settings');
  revalidatePath('/admin/dashboard');
}
