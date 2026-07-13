import type { NewsItem } from '@/domain/entities/NewsItem';
import type { INewsRepository } from '@/domain/repositories/INewsRepository';
import { canEditContent } from '@/lib/rbac';
import type { UseCaseContext } from '../../context';
import { updateNewsItemSchema } from '../../dtos/newsDtos';
import { NotFoundError, PermissionError, ValidationError } from '../../errors';

export interface UpdateNewsItemDeps {
  repo: INewsRepository;
}

export async function updateNewsItem(
  id: string,
  input: unknown,
  ctx: UseCaseContext,
  deps: UpdateNewsItemDeps,
): Promise<NewsItem> {
  const existing = await deps.repo.findById(ctx.tenantId, id);
  if (!existing) {
    throw new NotFoundError(`News item not found: ${id}`);
  }

  if (!canEditContent(ctx.actor, existing)) {
    throw new PermissionError('You do not have permission to edit this news item.');
  }

  const parsed = updateNewsItemSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError('Invalid news item input', parsed.error.issues.map((i) => i.message));
  }

  // Section 6: an Editor revising their own already-published item goes back
  // through review (if review mode is on); Admin edits are never re-routed.
  const isEditorRevisingPublished = ctx.actor!.role === 'editor' && existing.status === 'published';
  const statusPatch = isEditorRevisingPublished && ctx.reviewEnabled ? ({ status: 'pending_review' } as const) : {};

  return deps.repo.update(ctx.tenantId, id, { ...parsed.data, ...statusPatch });
}
