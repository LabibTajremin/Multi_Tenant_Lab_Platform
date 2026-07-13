import type { Tenant } from '@/domain/entities/Tenant';
import type { ITenantRepository } from '@/domain/repositories/ITenantRepository';
import { canToggleReviewMode } from '@/lib/rbac';
import type { UseCaseContext } from '../../context';
import { PermissionError } from '../../errors';

export interface ToggleReviewModeDeps {
  repo: ITenantRepository;
}

/** Section 1/5/13: the single global review-mode switch, Admin-only. */
export async function toggleReviewMode(
  enabled: boolean,
  ctx: UseCaseContext,
  deps: ToggleReviewModeDeps,
): Promise<Tenant> {
  if (!canToggleReviewMode(ctx.actor)) {
    throw new PermissionError('Only an Admin can toggle review mode.');
  }

  return deps.repo.setReviewEnabled(ctx.tenantId, enabled);
}
