import type { Publication } from '@/domain/entities/Publication';
import type { IPublicationRepository } from '@/domain/repositories/IPublicationRepository';
import { resolveSubmissionStatus } from '@/domain/value-objects/ContentStatus';
import { canCreateContent } from '@/lib/rbac';
import type { UseCaseContext } from '../../context';
import { createPublicationSchema } from '../../dtos/publicationDtos';
import { PermissionError, ValidationError } from '../../errors';

export interface CreatePublicationDeps {
  repo: IPublicationRepository;
}

export async function createPublication(
  input: unknown,
  ctx: UseCaseContext,
  deps: CreatePublicationDeps,
): Promise<Publication> {
  if (!canCreateContent(ctx.actor)) {
    throw new PermissionError('You do not have permission to add a publication.');
  }

  const parsed = createPublicationSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError('Invalid publication input', parsed.error.issues.map((i) => i.message));
  }

  const status = resolveSubmissionStatus(ctx.actor!.role, ctx.reviewEnabled);
  // Curating what shows on the home page is an Admin decision — silently
  // ignore the flag if an Editor's submission happened to include it.
  const isFeatured = ctx.actor!.role === 'admin' ? parsed.data.isFeatured : undefined;

  return deps.repo.create({
    tenantId: ctx.tenantId,
    title: parsed.data.title,
    authors: parsed.data.authors,
    venue: parsed.data.venue,
    year: parsed.data.year,
    doiOrLink: parsed.data.doiOrLink,
    pdfUrl: parsed.data.pdfUrl,
    status,
    isFeatured,
    createdBy: ctx.actor!.id,
  });
}
