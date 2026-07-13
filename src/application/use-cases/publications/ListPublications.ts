import type { Publication } from '@/domain/entities/Publication';
import type { IPublicationRepository } from '@/domain/repositories/IPublicationRepository';
import type { UseCaseContext } from '../../context';
import { PermissionError } from '../../errors';

export interface ListPublicationsDeps {
  repo: IPublicationRepository;
}

/** Admin/Editor listing (Section 13): every publication in the tenant, any
 * status. Public visitors never call this — the public /publications page
 * calls repo.listPublished() directly, which enforces status = 'published'
 * itself (Section 7), independent of this use case. */
export async function listPublications(ctx: UseCaseContext, deps: ListPublicationsDeps): Promise<Publication[]> {
  if (!ctx.actor) {
    throw new PermissionError('You must be signed in to view the publication list.');
  }
  return deps.repo.listAll(ctx.tenantId);
}
