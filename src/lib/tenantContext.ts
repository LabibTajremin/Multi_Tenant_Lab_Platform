import { cache } from 'react';
import type { Tenant } from '@/domain/entities/Tenant';
import { PostgresTenantRepository } from '@/infrastructure/repositories/PostgresTenantRepository';
import { getEnv } from './env';

/** This deployment's tenant id, from the required TENANT_ID env var (Section 2:
 * tenant resolution is env-var based, no subdomain/DNS detection in this version). */
export function getTenantId(): string {
  return getEnv().TENANT_ID;
}

/** Request-deduplicated (React cache()) lookup of this deployment's tenant row, so
 * a single request rendering several server components doesn't repeat the query. */
export const getCurrentTenant = cache(async (): Promise<Tenant> => {
  const tenantId = getTenantId();
  const repo = new PostgresTenantRepository();
  const tenant = await repo.findById(tenantId);
  if (!tenant) {
    throw new Error(
      `No tenant found for TENANT_ID=${tenantId}. Has this deployment been provisioned? See scripts/provision-tenant.ts.`,
    );
  }
  return tenant;
});
