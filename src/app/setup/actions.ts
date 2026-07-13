'use server';

import { redirect } from 'next/navigation';
import { PostgresTenantRepository } from '@/infrastructure/repositories/PostgresTenantRepository';
import { PostgresSiteSettingsRepository } from '@/infrastructure/repositories/PostgresSiteSettingsRepository';
import { getTenantId } from '@/lib/tenantContext';

export async function completeSetup(formData: FormData): Promise<void> {
  const tenantId = getTenantId();
  const labName = String(formData.get('labName') ?? '').trim();
  const theme = String(formData.get('theme') ?? 'default');
  const primaryColor = String(formData.get('primaryColor') ?? '');
  const tagline = String(formData.get('tagline') ?? '').trim();
  const contactEmail = String(formData.get('contactEmail') ?? '').trim();

  if (!labName) {
    throw new Error('Lab name is required.');
  }

  const tenantRepo = new PostgresTenantRepository();
  const siteSettingsRepo = new PostgresSiteSettingsRepository();

  await tenantRepo.update(tenantId, { labName, theme, primaryColor: primaryColor || null });
  // Writing this row is what flips isTenantProvisioned() to true (Section 5) and
  // ends the /setup redirect loop.
  await siteSettingsRepo.upsert(tenantId, {
    tagline: tagline || null,
    contactEmail: contactEmail || null,
  });

  redirect('/');
}
