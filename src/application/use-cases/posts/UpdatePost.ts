import type { Post } from '@/domain/entities/Post';
import type { IPostRepository } from '@/domain/repositories/IPostRepository';
import { canEditContent } from '@/lib/rbac';
import type { UseCaseContext } from '../../context';
import { updatePostSchema } from '../../dtos/postDtos';
import { NotFoundError, PermissionError, ValidationError } from '../../errors';

export interface UpdatePostDeps {
  repo: IPostRepository;
}

export async function updatePost(id: string, input: unknown, ctx: UseCaseContext, deps: UpdatePostDeps): Promise<Post> {
  const existing = await deps.repo.findById(ctx.tenantId, id);
  if (!existing) {
    throw new NotFoundError(`Post not found: ${id}`);
  }

  if (!canEditContent(ctx.actor, existing)) {
    throw new PermissionError('You do not have permission to edit this post.');
  }

  const parsed = updatePostSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError('Invalid post input', parsed.error.issues.map((i) => i.message));
  }

  const isEditorRevisingPublished = ctx.actor!.role === 'editor' && existing.status === 'published';
  const statusPatch = isEditorRevisingPublished && ctx.reviewEnabled ? ({ status: 'pending_review' } as const) : {};

  return deps.repo.update(ctx.tenantId, id, { ...parsed.data, ...statusPatch });
}
