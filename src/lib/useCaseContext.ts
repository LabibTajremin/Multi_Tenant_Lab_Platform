import type { UseCaseContext } from '@/application/context';
import { getSessionUser } from './session';
import { getCurrentTenant, getTenantId } from './tenantContext';

/** Builds the UseCaseContext every server action passes into an application
 * use case: the session actor (or null for a logged-out request), this
 * deployment's tenantId (never from client input), and the tenant's current
 * review_enabled flag (Section 7). */
export async function getUseCaseContext(): Promise<UseCaseContext> {
  const [actor, tenant] = await Promise.all([getSessionUser(), getCurrentTenant()]);
  return {
    actor,
    tenantId: getTenantId(),
    reviewEnabled: tenant.reviewEnabled,
  };
}
