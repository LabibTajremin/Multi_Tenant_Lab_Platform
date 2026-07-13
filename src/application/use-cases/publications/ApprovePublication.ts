import type { Publication } from '@/domain/entities/Publication';
import type { IPublicationRepository } from '@/domain/repositories/IPublicationRepository';
import { canApproveContent } from '@/lib/rbac';
import type { UseCaseContext } from '../../context';
import { NotFoundError, PermissionError, ValidationError } from '../../errors';

export interface ApprovePublicationDeps {
  repo: IPublicationRepository;
}

export type ReviewDecision = { approve: true } | { approve: false; note: string };

/** Section 7 review queue: Admin-only approve/reject on a pending_review item. */
export async function reviewPublication(
  id: string,
  decision: ReviewDecision,
  ctx: UseCaseContext,
  deps: ApprovePublicationDeps,
): Promise<Publication> {
  if (!canApproveContent(ctx.actor)) {
    throw new PermissionError('Only an Admin can approve or reject content.');
  }

  const existing = await deps.repo.findById(ctx.tenantId, id);
  if (!existing) {
    throw new NotFoundError(`Publication not found: ${id}`);
  }
  if (existing.status !== 'pending_review') {
    throw new ValidationError(`Publication ${id} is not pending review (status: ${existing.status}).`);
  }

  if (!decision.approve && !decision.note.trim()) {
    throw new ValidationError('A review note is required when rejecting content.');
  }

  return deps.repo.update(ctx.tenantId, id, {
    status: decision.approve ? 'published' : 'rejected',
    reviewedBy: ctx.actor!.id,
    reviewNote: decision.approve ? null : decision.note,
  });
}
