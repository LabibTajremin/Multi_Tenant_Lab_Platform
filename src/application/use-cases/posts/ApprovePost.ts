import type { Post } from '@/domain/entities/Post';
import type { IPostRepository } from '@/domain/repositories/IPostRepository';
import { canApproveContent } from '@/lib/rbac';
import type { UseCaseContext } from '../../context';
import { NotFoundError, PermissionError, ValidationError } from '../../errors';

export interface ApprovePostDeps {
  repo: IPostRepository;
}

export type ReviewDecision = { approve: true } | { approve: false; note: string };

export async function reviewPost(
  id: string,
  decision: ReviewDecision,
  ctx: UseCaseContext,
  deps: ApprovePostDeps,
): Promise<Post> {
  if (!canApproveContent(ctx.actor)) {
    throw new PermissionError('Only an Admin can approve or reject content.');
  }

  const existing = await deps.repo.findById(ctx.tenantId, id);
  if (!existing) {
    throw new NotFoundError(`Post not found: ${id}`);
  }
  if (existing.status !== 'pending_review') {
    throw new ValidationError(`Post ${id} is not pending review (status: ${existing.status}).`);
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
