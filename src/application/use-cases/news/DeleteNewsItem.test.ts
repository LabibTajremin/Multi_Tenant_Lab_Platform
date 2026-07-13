import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { INewsRepository } from '@/domain/repositories/INewsRepository';
import type { UseCaseContext } from '../../context';
import { makeNewsItem } from '../../../../tests/fixtures/factories';
import { deleteNewsItem } from './DeleteNewsItem';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };
const editor = { id: 'editor-1', role: 'editor' as const };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: false, ...overrides };
}

describe('deleteNewsItem', () => {
  it('happy path: Editor deletes their own draft', async () => {
    const repo = mock<INewsRepository>();
    const existing = makeNewsItem({ tenantId: 'tenant-1', createdBy: editor.id, status: 'draft' });
    repo.findById.mockResolvedValue(existing);

    await deleteNewsItem(existing.id, ctx({ actor: editor }), { repo });

    expect(repo.delete).toHaveBeenCalledWith('tenant-1', existing.id);
  });

  it('permission-denied: Editor cannot delete their own published news item', async () => {
    const repo = mock<INewsRepository>();
    const existing = makeNewsItem({ tenantId: 'tenant-1', createdBy: editor.id, status: 'published' });
    repo.findById.mockResolvedValue(existing);

    await expect(deleteNewsItem(existing.id, ctx({ actor: editor }), { repo })).rejects.toThrow(PermissionError);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('not found: throws when missing', async () => {
    const repo = mock<INewsRepository>();
    repo.findById.mockResolvedValue(null);

    await expect(deleteNewsItem('missing', ctx(), { repo })).rejects.toThrow(/not found/i);
  });

  it('tenant-scoping: uses ctx.tenantId for both lookup and delete', async () => {
    const repo = mock<INewsRepository>();
    const existing = makeNewsItem({ tenantId: 'tenant-xyz', createdBy: admin.id });
    repo.findById.mockResolvedValue(existing);

    await deleteNewsItem(existing.id, ctx({ tenantId: 'tenant-xyz' }), { repo });

    expect(repo.delete).toHaveBeenCalledWith('tenant-xyz', existing.id);
  });
});
