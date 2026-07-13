import type { NewsItem } from '@/domain/entities/NewsItem';
import type { INewsRepository } from '@/domain/repositories/INewsRepository';
import { resolveSubmissionStatus } from '@/domain/value-objects/ContentStatus';
import { canCreateContent } from '@/lib/rbac';
import type { UseCaseContext } from '../../context';
import { createNewsItemSchema } from '../../dtos/newsDtos';
import { PermissionError, ValidationError } from '../../errors';

export interface CreateNewsItemDeps {
  repo: INewsRepository;
}

export async function createNewsItem(input: unknown, ctx: UseCaseContext, deps: CreateNewsItemDeps): Promise<NewsItem> {
  if (!canCreateContent(ctx.actor)) {
    throw new PermissionError('You do not have permission to add a news item.');
  }

  const parsed = createNewsItemSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError('Invalid news item input', parsed.error.issues.map((i) => i.message));
  }

  const status = resolveSubmissionStatus(ctx.actor!.role, ctx.reviewEnabled);
  // Curating what shows on the home page is an Admin decision — silently
  // ignore the flag if an Editor's submission happened to include it.
  const isFeatured = ctx.actor!.role === 'admin' ? parsed.data.isFeatured : undefined;

  return deps.repo.create({
    tenantId: ctx.tenantId,
    title: parsed.data.title,
    body: parsed.data.body,
    imageUrl: parsed.data.imageUrl,
    imageAlt: parsed.data.imageAlt,
    linkUrl: parsed.data.linkUrl,
    publishedDate: parsed.data.publishedDate,
    status,
    isFeatured,
    createdBy: ctx.actor!.id,
  });
}
