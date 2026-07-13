import type { IPostRepository } from '@/domain/repositories/IPostRepository';
import { canDeleteContent } from '@/lib/rbac';
import type { UseCaseContext } from '../../context';
import { NotFoundError, PermissionError } from '../../errors';

export interface DeletePostDeps {
  repo: IPostRepository;
}

export async function deletePost(id: string, ctx: UseCaseContext, deps: DeletePostDeps): Promise<void> {
  const existing = await deps.repo.findById(ctx.tenantId, id);
  if (!existing) {
    throw new NotFoundError(`Post not found: ${id}`);
  }

  if (!canDeleteContent(ctx.actor, existing)) {
    throw new PermissionError('You do not have permission to delete this post.');
  }

  await deps.repo.delete(ctx.tenantId, id);
}
