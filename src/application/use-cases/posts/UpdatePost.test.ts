import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IPostRepository } from '@/domain/repositories/IPostRepository';
import type { UseCaseContext } from '../../context';
import { makePost } from '../../../../tests/fixtures/factories';
import { updatePost } from './UpdatePost';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };
const editor = { id: 'editor-1', role: 'editor' as const };
const otherEditor = { id: 'editor-2', role: 'editor' as const };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: false, ...overrides };
}

describe('updatePost', () => {
  it('happy path: Admin edits any post', async () => {
    const repo = mock<IPostRepository>();
    const existing = makePost({ tenantId: 'tenant-1', createdBy: editor.id });
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await updatePost(existing.id, { title: 'Updated' }, ctx(), { repo });

    expect(repo.update).toHaveBeenCalledWith('tenant-1', existing.id, expect.objectContaining({ title: 'Updated' }));
  });

  it("permission-denied: Editor cannot edit another Editor's post", async () => {
    const repo = mock<IPostRepository>();
    const existing = makePost({ tenantId: 'tenant-1', createdBy: otherEditor.id });
    repo.findById.mockResolvedValue(existing);

    await expect(updatePost(existing.id, { title: 'x' }, ctx({ actor: editor }), { repo })).rejects.toThrow(
      PermissionError,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('validation failure: rejects an image without alt text', async () => {
    const repo = mock<IPostRepository>();
    const existing = makePost({ tenantId: 'tenant-1', createdBy: admin.id });
    repo.findById.mockResolvedValue(existing);

    await expect(
      updatePost(existing.id, { imageUrl: 'https://example.edu/x.png' }, ctx(), { repo }),
    ).rejects.toThrow();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('not found: throws when missing', async () => {
    const repo = mock<IPostRepository>();
    repo.findById.mockResolvedValue(null);

    await expect(updatePost('missing', { title: 'x' }, ctx(), { repo })).rejects.toThrow(/not found/i);
  });

  it('review-mode branching: Editor revising their own published post goes back to pending_review when review mode is on', async () => {
    const repo = mock<IPostRepository>();
    const existing = makePost({ tenantId: 'tenant-1', createdBy: editor.id, status: 'published' });
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await updatePost(existing.id, { title: 'Revised' }, ctx({ actor: editor, reviewEnabled: true }), { repo });

    expect(repo.update).toHaveBeenCalledWith('tenant-1', existing.id, expect.objectContaining({ status: 'pending_review' }));
  });

  it('tenant-scoping: uses ctx.tenantId', async () => {
    const repo = mock<IPostRepository>();
    const existing = makePost({ tenantId: 'tenant-xyz', createdBy: admin.id });
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await updatePost(existing.id, { title: 'x' }, ctx({ tenantId: 'tenant-xyz' }), { repo });

    expect(repo.findById).toHaveBeenCalledWith('tenant-xyz', existing.id);
  });
});
