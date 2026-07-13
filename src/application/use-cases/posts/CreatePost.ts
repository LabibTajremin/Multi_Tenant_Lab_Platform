import type { Post } from '@/domain/entities/Post';
import type { IPostRepository } from '@/domain/repositories/IPostRepository';
import type { PostType } from '@/domain/value-objects/PostType';
import { resolveSubmissionStatus } from '@/domain/value-objects/ContentStatus';
import { canCreateContent } from '@/lib/rbac';
import type { UseCaseContext } from '../../context';
import { createPostSchema } from '../../dtos/postDtos';
import { PermissionError, ValidationError } from '../../errors';

export interface CreatePostDeps {
  repo: IPostRepository;
}

export async function createPost(input: unknown, ctx: UseCaseContext, deps: CreatePostDeps): Promise<Post> {
  if (!canCreateContent(ctx.actor)) {
    throw new PermissionError('You do not have permission to add a post.');
  }

  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError('Invalid post input', parsed.error.issues.map((i) => i.message));
  }

  const status = resolveSubmissionStatus(ctx.actor!.role, ctx.reviewEnabled);

  return deps.repo.create({
    tenantId: ctx.tenantId,
    postType: parsed.data.postType as PostType,
    title: parsed.data.title,
    body: parsed.data.body,
    imageUrl: parsed.data.imageUrl,
    imageAlt: parsed.data.imageAlt,
    status,
    createdBy: ctx.actor!.id,
  });
}
