import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { INewsRepository } from '@/domain/repositories/INewsRepository';
import type { UseCaseContext } from '../../context';
import { makeNewsItem } from '../../../../tests/fixtures/factories';
import { createNewsItem } from './CreateNewsItem';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };
const editor = { id: 'editor-1', role: 'editor' as const };
const validInput = { title: 'Lab wins award', body: 'Details here.' };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: false, ...overrides };
}

describe('createNewsItem', () => {
  it('happy path: Admin creates a news item, published immediately', async () => {
    const repo = mock<INewsRepository>();
    repo.create.mockResolvedValue(makeNewsItem());

    await createNewsItem(validInput, ctx(), { repo });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'published', createdBy: admin.id }));
  });

  it('permission-denied: public actor cannot create a news item', async () => {
    const repo = mock<INewsRepository>();

    await expect(createNewsItem(validInput, ctx({ actor: null }), { repo })).rejects.toThrow(PermissionError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('validation failure: rejects an image without alt text', async () => {
    const repo = mock<INewsRepository>();

    await expect(
      createNewsItem({ ...validInput, imageUrl: 'https://example.edu/x.png' }, ctx(), { repo }),
    ).rejects.toThrow();
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('review-mode branching: Editor submission is pending_review when review mode is on', async () => {
    const repo = mock<INewsRepository>();
    repo.create.mockResolvedValue(makeNewsItem());

    await createNewsItem(validInput, ctx({ actor: editor, reviewEnabled: true }), { repo });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending_review' }));
  });

  it('review-mode branching: Editor submission publishes immediately when review mode is off', async () => {
    const repo = mock<INewsRepository>();
    repo.create.mockResolvedValue(makeNewsItem());

    await createNewsItem(validInput, ctx({ actor: editor, reviewEnabled: false }), { repo });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'published' }));
  });

  it('tenant-scoping: uses ctx.tenantId', async () => {
    const repo = mock<INewsRepository>();
    repo.create.mockResolvedValue(makeNewsItem());

    await createNewsItem(validInput, ctx({ tenantId: 'tenant-xyz' }), { repo });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-xyz' }));
  });
});
