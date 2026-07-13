import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IPublicationRepository } from '@/domain/repositories/IPublicationRepository';
import type { UseCaseContext } from '../../context';
import { makePublication } from '../../../../tests/fixtures/factories';
import { reviewPublication } from './ApprovePublication';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };
const editor = { id: 'editor-1', role: 'editor' as const };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: true, ...overrides };
}

describe('reviewPublication (approve/reject)', () => {
  it('happy path: Admin approves a pending publication', async () => {
    const repo = mock<IPublicationRepository>();
    const pending = makePublication({ tenantId: 'tenant-1', status: 'pending_review' });
    repo.findById.mockResolvedValue(pending);
    repo.update.mockResolvedValue({ ...pending, status: 'published' });

    await reviewPublication(pending.id, { approve: true }, ctx(), { repo });

    expect(repo.update).toHaveBeenCalledWith(
      'tenant-1',
      pending.id,
      expect.objectContaining({ status: 'published', reviewedBy: admin.id }),
    );
  });

  it('happy path: Admin rejects a pending publication with a note', async () => {
    const repo = mock<IPublicationRepository>();
    const pending = makePublication({ tenantId: 'tenant-1', status: 'pending_review' });
    repo.findById.mockResolvedValue(pending);
    repo.update.mockResolvedValue({ ...pending, status: 'rejected' });

    await reviewPublication(pending.id, { approve: false, note: 'Needs more citations' }, ctx(), { repo });

    expect(repo.update).toHaveBeenCalledWith(
      'tenant-1',
      pending.id,
      expect.objectContaining({ status: 'rejected', reviewNote: 'Needs more citations' }),
    );
  });

  it('permission-denied: an Editor cannot approve content, even their own', async () => {
    const repo = mock<IPublicationRepository>();
    const pending = makePublication({ tenantId: 'tenant-1', createdBy: editor.id, status: 'pending_review' });
    repo.findById.mockResolvedValue(pending);

    await expect(
      reviewPublication(pending.id, { approve: true }, ctx({ actor: editor }), { repo }),
    ).rejects.toThrow(PermissionError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('validation failure: rejecting without a note is refused', async () => {
    const repo = mock<IPublicationRepository>();
    const pending = makePublication({ tenantId: 'tenant-1', status: 'pending_review' });
    repo.findById.mockResolvedValue(pending);

    await expect(reviewPublication(pending.id, { approve: false, note: '   ' }, ctx(), { repo })).rejects.toThrow();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('validation failure: cannot review a publication that is not pending_review', async () => {
    const repo = mock<IPublicationRepository>();
    const already = makePublication({ tenantId: 'tenant-1', status: 'published' });
    repo.findById.mockResolvedValue(already);

    await expect(reviewPublication(already.id, { approve: true }, ctx(), { repo })).rejects.toThrow();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('not found: throws for a missing publication', async () => {
    const repo = mock<IPublicationRepository>();
    repo.findById.mockResolvedValue(null);

    await expect(reviewPublication('missing', { approve: true }, ctx(), { repo })).rejects.toThrow(/not found/i);
  });

  it('tenant-scoping: findById and update both use ctx.tenantId', async () => {
    const repo = mock<IPublicationRepository>();
    const pending = makePublication({ tenantId: 'tenant-xyz', status: 'pending_review' });
    repo.findById.mockResolvedValue(pending);
    repo.update.mockResolvedValue(pending);

    await reviewPublication(pending.id, { approve: true }, ctx({ tenantId: 'tenant-xyz' }), { repo });

    expect(repo.findById).toHaveBeenCalledWith('tenant-xyz', pending.id);
    expect(repo.update).toHaveBeenCalledWith('tenant-xyz', pending.id, expect.anything());
  });
});
