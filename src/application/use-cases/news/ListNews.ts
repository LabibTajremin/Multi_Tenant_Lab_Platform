import type { NewsItem } from '@/domain/entities/NewsItem';
import type { INewsRepository } from '@/domain/repositories/INewsRepository';
import type { UseCaseContext } from '../../context';
import { PermissionError } from '../../errors';

export interface ListNewsDeps {
  repo: INewsRepository;
}

/** Admin/Editor listing (Section 13). Public /news calls repo.listPublished()
 * directly, which enforces status = 'published' itself (Section 7). */
export async function listNews(ctx: UseCaseContext, deps: ListNewsDeps): Promise<NewsItem[]> {
  if (!ctx.actor) {
    throw new PermissionError('You must be signed in to view the news list.');
  }
  return deps.repo.listAll(ctx.tenantId);
}
