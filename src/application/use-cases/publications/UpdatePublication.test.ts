import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IPublicationRepository } from '@/domain/repositories/IPublicationRepository';
import type { UseCaseContext } from '../../context';
import { makePublication } from '../../../../tests/fixtures/factories';
import { updatePublication } from './UpdatePublication';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };
const editor = { id: 'editor-1', role: 'editor' as const };
const otherEditor = { id: 'editor-2', role: 'editor' as const };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: false, ...overrides };
}

describe('updatePublication', () => {
  it('happy path: Admin edits any publication', async () => {
    const repo = mock<IPublicationRepository>();
    const existing = makePublication({ tenantId: 'tenant-1', createdBy: editor.id, status: 'published' });
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await updatePublication(existing.id, { title: 'Updated Title' }, ctx({ actor: admin }), { repo });

    expect(repo.update).toHaveBeenCalledWith('tenant-1', existing.id, expect.objectContaining({ title: 'Updated Title' }));
  });

  it('permission-denied: an Editor cannot edit another Editor\'s publication', async () => {
    const repo = mock<IPublicationRepository>();
    const existing = makePublication({ tenantId: 'tenant-1', createdBy: otherEditor.id });
    repo.findById.mockResolvedValue(existing);

    await expect(
      updatePublication(existing.id, { title: 'x' }, ctx({ actor: editor }), { repo }),
    ).rejects.toThrow(PermissionError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('validation failure: rejects an out-of-range year before touching the repo', async () => {
    const repo = mock<IPublicationRepository>();
    const existing = makePublication({ tenantId: 'tenant-1', createdBy: admin.id });
    repo.findById.mockResolvedValue(existing);

    await expect(updatePublication(existing.id, { year: 1500 }, ctx(), { repo })).rejects.toThrow();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('not found: throws when the publication does not exist in this tenant', async () => {
    const repo = mock<IPublicationRepository>();
    repo.findById.mockResolvedValue(null);

    await expect(updatePublication('missing-id', { title: 'x' }, ctx(), { repo })).rejects.toThrow(/not found/i);
  });

  it('review-mode branching: Editor revising their own published work is sent back to pending_review when review mode is on', async () => {
    const repo = mock<IPublicationRepository>();
    const existing = makePublication({ tenantId: 'tenant-1', createdBy: editor.id, status: 'published' });
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await updatePublication(existing.id, { title: 'Revised' }, ctx({ actor: editor, reviewEnabled: true }), { repo });

    expect(repo.update).toHaveBeenCalledWith(
      'tenant-1',
      existing.id,
      expect.objectContaining({ status: 'pending_review' }),
    );
  });

  it('review-mode branching: Editor revising their own published work stays published when review mode is off', async () => {
    const repo = mock<IPublicationRepository>();
    const existing = makePublication({ tenantId: 'tenant-1', createdBy: editor.id, status: 'published' });
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await updatePublication(existing.id, { title: 'Revised' }, ctx({ actor: editor, reviewEnabled: false }), { repo });

    const patch = repo.update.mock.calls[0]?.[2];
    expect(patch?.status).toBeUndefined();
  });

  it('tenant-scoping: findById and update are both called with ctx.tenantId', async () => {
    const repo = mock<IPublicationRepository>();
    const existing = makePublication({ tenantId: 'tenant-xyz', createdBy: admin.id });
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await updatePublication(existing.id, { title: 'x' }, ctx({ tenantId: 'tenant-xyz' }), { repo });

    expect(repo.findById).toHaveBeenCalledWith('tenant-xyz', existing.id);
    expect(repo.update).toHaveBeenCalledWith('tenant-xyz', existing.id, expect.anything());
  });

  it('home-page curation: Admin can feature/unfeature a publication', async () => {
    const repo = mock<IPublicationRepository>();
    const existing = makePublication({ tenantId: 'tenant-1', createdBy: admin.id });
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await updatePublication(existing.id, { isFeatured: true }, ctx({ actor: admin }), { repo });

    expect(repo.update).toHaveBeenCalledWith('tenant-1', existing.id, expect.objectContaining({ isFeatured: true }));
  });

  it('home-page curation: an Editor cannot feature their own publication — the flag is silently ignored', async () => {
    const repo = mock<IPublicationRepository>();
    const existing = makePublication({ tenantId: 'tenant-1', createdBy: editor.id, status: 'draft' });
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await updatePublication(existing.id, { isFeatured: true }, ctx({ actor: editor }), { repo });

    const patch = repo.update.mock.calls[0]?.[2];
    expect(patch?.isFeatured).toBeUndefined();
  });
});
