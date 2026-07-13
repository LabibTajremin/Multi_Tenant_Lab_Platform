import { cache } from 'react';
import { PostgresSiteSettingsRepository } from '@/infrastructure/repositories/PostgresSiteSettingsRepository';
import { getTenantId } from './tenantContext';

/**
 * Section 5: a deployment is "provisioned" once its tenant has a site_settings
 * row. A freshly-run provision-tenant.ts script creates tenants + the first
 * Admin, but the /setup wizard is what actually writes site_settings — so this
 * is the signal every page/layout checks before rendering normally.
 */
export const isTenantProvisioned = cache(async (): Promise<boolean> => {
  const tenantId = getTenantId();
  const repo = new PostgresSiteSettingsRepository();
  const settings = await repo.getByTenant(tenantId);
  return settings !== null;
});
