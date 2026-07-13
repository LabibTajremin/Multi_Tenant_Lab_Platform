import type { IMemberRepository } from '@/domain/repositories/IMemberRepository';
import { canManageMembers } from '@/lib/rbac';
import type { UseCaseContext } from '../../context';
import { NotFoundError, PermissionError } from '../../errors';

export interface DeleteMemberProfileDeps {
  repo: IMemberRepository;
}

/** Section 6: deleting a member profile is Admin-only, always — unlike bio edits. */
export async function deleteMemberProfile(id: string, ctx: UseCaseContext, deps: DeleteMemberProfileDeps): Promise<void> {
  if (!canManageMembers(ctx.actor)) {
    throw new PermissionError('Only an Admin can remove a member profile.');
  }

  const existing = await deps.repo.findById(ctx.tenantId, id);
  if (!existing) {
    throw new NotFoundError(`Member not found: ${id}`);
  }

  await deps.repo.delete(ctx.tenantId, id);
}
