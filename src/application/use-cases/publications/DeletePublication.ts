import type { IPublicationRepository } from '@/domain/repositories/IPublicationRepository';
import { canDeleteContent } from '@/lib/rbac';
import type { UseCaseContext } from '../../context';
import { NotFoundError, PermissionError } from '../../errors';

export interface DeletePublicationDeps {
  repo: IPublicationRepository;
}

export async function deletePublication(id: string, ctx: UseCaseContext, deps: DeletePublicationDeps): Promise<void> {
  const existing = await deps.repo.findById(ctx.tenantId, id);
  if (!existing) {
    throw new NotFoundError(`Publication not found: ${id}`);
  }

  if (!canDeleteContent(ctx.actor, existing)) {
    throw new PermissionError('You do not have permission to delete this publication.');
  }

  await deps.repo.delete(ctx.tenantId, id);
}
