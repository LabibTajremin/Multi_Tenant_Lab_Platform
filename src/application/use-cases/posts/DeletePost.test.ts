import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IPostRepository } from '@/domain/repositories/IPostRepository';
import type { UseCaseContext } from '../../context';
import { makePost } from '../../../../tests/fixtures/factories';
import { deletePost } from './DeletePost';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };
const editor = { id: 'editor-1', role: 'editor' as const };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: false, ...overrides };
}

describe('deletePost', () => {
  it('happy path: Editor deletes their own draft', async () => {
    const repo = mock<IPostRepository>();
    const existing = makePost({ tenantId: 'tenant-1', createdBy: editor.id, status: 'draft' });
    repo.findById.mockResolvedValue(existing);

    await deletePost(existing.id, ctx({ actor: editor }), { repo });

    expect(repo.delete).toHaveBeenCalledWith('tenant-1', existing.id);
  });

  it('permission-denied: Editor cannot delete their own published post', async () => {
    const repo = mock<IPostRepository>();
    const existing = makePost({ tenantId: 'tenant-1', createdBy: editor.id, status: 'published' });
    repo.findById.mockResolvedValue(existing);

    await expect(deletePost(existing.id, ctx({ actor: editor }), { repo })).rejects.toThrow(PermissionError);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('not found: throws when missing', async () => {
    const repo = mock<IPostRepository>();
    repo.findById.mockResolvedValue(null);

    await expect(deletePost('missing', ctx(), { repo })).rejects.toThrow(/not found/i);
  });

  it('tenant-scoping: uses ctx.tenantId', async () => {
    const repo = mock<IPostRepository>();
    const existing = makePost({ tenantId: 'tenant-xyz', createdBy: admin.id });
    repo.findById.mockResolvedValue(existing);

    await deletePost(existing.id, ctx({ tenantId: 'tenant-xyz' }), { repo });

    expect(repo.delete).toHaveBeenCalledWith('tenant-xyz', existing.id);
  });
});
