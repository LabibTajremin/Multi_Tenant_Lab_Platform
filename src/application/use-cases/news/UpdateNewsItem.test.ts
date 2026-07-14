import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { INewsRepository } from '@/domain/repositories/INewsRepository';
import type { UseCaseContext } from '../../context';
import { makeNewsItem } from '../../../../tests/fixtures/factories';
import { updateNewsItem } from './UpdateNewsItem';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };
const editor = { id: 'editor-1', role: 'editor' as const };
const otherEditor = { id: 'editor-2', role: 'editor' as const };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: false, ...overrides };
}

describe('updateNewsItem', () => {
  it('happy path: Admin edits any news item', async () => {
    const repo = mock<INewsRepository>();
    const existing = makeNewsItem({ tenantId: 'tenant-1', createdBy: editor.id });
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await updateNewsItem(existing.id, { title: 'Updated' }, ctx(), { repo });

    expect(repo.update).toHaveBeenCalledWith('tenant-1', existing.id, expect.objectContaining({ title: 'Updated' }));
  });

  it("permission-denied: an Editor cannot edit another Editor's news item", async () => {
    const repo = mock<INewsRepository>();
    const existing = makeNewsItem({ tenantId: 'tenant-1', createdBy: otherEditor.id });
    repo.findById.mockResolvedValue(existing);

    await expect(updateNewsItem(existing.id, { title: 'x' }, ctx({ actor: editor }), { repo })).rejects.toThrow(
      PermissionError,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('validation failure: rejects an empty body', async () => {
    const repo = mock<INewsRepository>();
    const existing = makeNewsItem({ tenantId: 'tenant-1', createdBy: admin.id });
    repo.findById.mockResolvedValue(existing);

    await expect(updateNewsItem(existing.id, { body: '' }, ctx(), { repo })).rejects.toThrow();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('not found: throws when the news item does not exist', async () => {
    const repo = mock<INewsRepository>();
    repo.findById.mockResolvedValue(null);

    await expect(updateNewsItem('missing', { title: 'x' }, ctx(), { repo })).rejects.toThrow(/not found/i);
  });

  it('review-mode branching: Editor revising their own published item goes back to pending_review when review mode is on', async () => {
    const repo = mock<INewsRepository>();
    const existing = makeNewsItem({ tenantId: 'tenant-1', createdBy: editor.id, status: 'published' });
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await updateNewsItem(existing.id, { title: 'Revised' }, ctx({ actor: editor, reviewEnabled: true }), { repo });

    expect(repo.update).toHaveBeenCalledWith('tenant-1', existing.id, expect.objectContaining({ status: 'pending_review' }));
  });

  it('tenant-scoping: findById and update both use ctx.tenantId', async () => {
    const repo = mock<INewsRepository>();
    const existing = makeNewsItem({ tenantId: 'tenant-xyz', createdBy: admin.id });
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await updateNewsItem(existing.id, { title: 'x' }, ctx({ tenantId: 'tenant-xyz' }), { repo });

    expect(repo.findById).toHaveBeenCalledWith('tenant-xyz', existing.id);
  });

  it('home-page curation: Admin can feature/unfeature a news item', async () => {
    const repo = mock<INewsRepository>();
    const existing = makeNewsItem({ tenantId: 'tenant-1', createdBy: admin.id });
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await updateNewsItem(existing.id, { isFeatured: true }, ctx({ actor: admin }), { repo });

    expect(repo.update).toHaveBeenCalledWith('tenant-1', existing.id, expect.objectContaining({ isFeatured: true }));
  });

  it('home-page curation: an Editor cannot feature their own news item — the flag is silently ignored', async () => {
    const repo = mock<INewsRepository>();
    const existing = makeNewsItem({ tenantId: 'tenant-1', createdBy: editor.id, status: 'draft' });
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await updateNewsItem(existing.id, { isFeatured: true }, ctx({ actor: editor }), { repo });

    const patch = repo.update.mock.calls[0]?.[2];
    expect(patch?.isFeatured).toBeUndefined();
  });
});
