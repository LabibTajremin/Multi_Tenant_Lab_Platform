import type { Publication } from '@/domain/entities/Publication';
import type { IPublicationRepository } from '@/domain/repositories/IPublicationRepository';
import { canEditContent } from '@/lib/rbac';
import type { UseCaseContext } from '../../context';
import { updatePublicationSchema } from '../../dtos/publicationDtos';
import { NotFoundError, PermissionError, ValidationError } from '../../errors';

export interface UpdatePublicationDeps {
  repo: IPublicationRepository;
}

export async function updatePublication(
  id: string,
  input: unknown,
  ctx: UseCaseContext,
  deps: UpdatePublicationDeps,
): Promise<Publication> {
  const existing = await deps.repo.findById(ctx.tenantId, id);
  if (!existing) {
    throw new NotFoundError(`Publication not found: ${id}`);
  }

  if (!canEditContent(ctx.actor, existing)) {
    throw new PermissionError('You do not have permission to edit this publication.');
  }

  const parsed = updatePublicationSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError('Invalid publication input', parsed.error.issues.map((i) => i.message));
  }

  // Section 6: an Editor editing their own already-published content sends it
  // back through review (if review mode is on) rather than silently republishing
  // an unreviewed change. Admin edits never get re-routed through review.
  const isEditorRevisingPublished = ctx.actor!.role === 'editor' && existing.status === 'published';
  const statusPatch = isEditorRevisingPublished && ctx.reviewEnabled ? ({ status: 'pending_review' } as const) : {};

  // Curating what shows on the home page is an Admin decision — silently
  // ignore the flag if an Editor's edit happened to include it.
  const isFeatured = ctx.actor!.role === 'admin' ? parsed.data.isFeatured : undefined;

  return deps.repo.update(ctx.tenantId, id, { ...parsed.data, isFeatured, ...statusPatch });
}
