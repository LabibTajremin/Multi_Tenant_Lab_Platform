import type { Post } from '@/domain/entities/Post';
import type { IPostRepository } from '@/domain/repositories/IPostRepository';
import type { PostType } from '@/domain/value-objects/PostType';
import type { UseCaseContext } from '../../context';
import { PermissionError } from '../../errors';

export interface ListPostsDeps {
  repo: IPostRepository;
}

/** Admin/Editor listing (Section 13). Public /funding and /gallery call
 * repo.listPublished() directly, which enforces status = 'published' itself. */
export async function listPosts(ctx: UseCaseContext, deps: ListPostsDeps, postType?: PostType): Promise<Post[]> {
  if (!ctx.actor) {
    throw new PermissionError('You must be signed in to view the post list.');
  }
  return deps.repo.listAll(ctx.tenantId, postType);
}
