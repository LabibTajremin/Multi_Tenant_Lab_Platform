import type { INewsRepository } from '@/domain/repositories/INewsRepository';
import { canDeleteContent } from '@/lib/rbac';
import type { UseCaseContext } from '../../context';
import { NotFoundError, PermissionError } from '../../errors';

export interface DeleteNewsItemDeps {
  repo: INewsRepository;
}

export async function deleteNewsItem(id: string, ctx: UseCaseContext, deps: DeleteNewsItemDeps): Promise<void> {
  const existing = await deps.repo.findById(ctx.tenantId, id);
  if (!existing) {
    throw new NotFoundError(`News item not found: ${id}`);
  }

  if (!canDeleteContent(ctx.actor, existing)) {
    throw new PermissionError('You do not have permission to delete this news item.');
  }

  await deps.repo.delete(ctx.tenantId, id);
}
