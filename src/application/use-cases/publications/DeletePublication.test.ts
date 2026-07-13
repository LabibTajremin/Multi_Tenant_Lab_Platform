import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IPublicationRepository } from '@/domain/repositories/IPublicationRepository';
import type { UseCaseContext } from '../../context';
import { makePublication } from '../../../../tests/fixtures/factories';
import { deletePublication } from './DeletePublication';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };
const editor = { id: 'editor-1', role: 'editor' as const };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: false, ...overrides };
}

describe('deletePublication', () => {
  it('happy path: Editor deletes their own draft', async () => {
    const repo = mock<IPublicationRepository>();
    const existing = makePublication({ tenantId: 'tenant-1', createdBy: editor.id, status: 'draft' });
    repo.findById.mockResolvedValue(existing);

    await deletePublication(existing.id, ctx({ actor: editor }), { repo });

    expect(repo.delete).toHaveBeenCalledWith('tenant-1', existing.id);
  });

  it('permission-denied: Editor cannot delete their own published publication (default policy)', async () => {
    const repo = mock<IPublicationRepository>();
    const existing = makePublication({ tenantId: 'tenant-1', createdBy: editor.id, status: 'published' });
    repo.findById.mockResolvedValue(existing);

    await expect(deletePublication(existing.id, ctx({ actor: editor }), { repo })).rejects.toThrow(PermissionError);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('permission-denied: public actor cannot delete', async () => {
    const repo = mock<IPublicationRepository>();
    repo.findById.mockResolvedValue(makePublication({ tenantId: 'tenant-1' }));

    await expect(deletePublication('id', ctx({ actor: null }), { repo })).rejects.toThrow(PermissionError);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('not found: throws when the publication does not exist', async () => {
    const repo = mock<IPublicationRepository>();
    repo.findById.mockResolvedValue(null);

    await expect(deletePublication('missing', ctx(), { repo })).rejects.toThrow(/not found/i);
  });

  it('tenant-scoping: findById and delete both use ctx.tenantId', async () => {
    const repo = mock<IPublicationRepository>();
    const existing = makePublication({ tenantId: 'tenant-xyz', createdBy: admin.id });
    repo.findById.mockResolvedValue(existing);

    await deletePublication(existing.id, ctx({ tenantId: 'tenant-xyz' }), { repo });

    expect(repo.findById).toHaveBeenCalledWith('tenant-xyz', existing.id);
    expect(repo.delete).toHaveBeenCalledWith('tenant-xyz', existing.id);
  });
});
