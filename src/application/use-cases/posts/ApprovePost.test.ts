import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IPostRepository } from '@/domain/repositories/IPostRepository';
import type { UseCaseContext } from '../../context';
import { makePost } from '../../../../tests/fixtures/factories';
import { reviewPost } from './ApprovePost';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };
const editor = { id: 'editor-1', role: 'editor' as const };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: true, ...overrides };
}

describe('reviewPost (approve/reject)', () => {
  it('happy path: Admin approves a pending post', async () => {
    const repo = mock<IPostRepository>();
    const pending = makePost({ tenantId: 'tenant-1', status: 'pending_review' });
    repo.findById.mockResolvedValue(pending);
    repo.update.mockResolvedValue({ ...pending, status: 'published' });

    await reviewPost(pending.id, { approve: true }, ctx(), { repo });

    expect(repo.update).toHaveBeenCalledWith(
      'tenant-1',
      pending.id,
      expect.objectContaining({ status: 'published', reviewedBy: admin.id }),
    );
  });

  it('permission-denied: an Editor cannot approve, even their own', async () => {
    const repo = mock<IPostRepository>();
    const pending = makePost({ tenantId: 'tenant-1', createdBy: editor.id, status: 'pending_review' });
    repo.findById.mockResolvedValue(pending);

    await expect(reviewPost(pending.id, { approve: true }, ctx({ actor: editor }), { repo })).rejects.toThrow(
      PermissionError,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('not found: throws for a missing post', async () => {
    const repo = mock<IPostRepository>();
    repo.findById.mockResolvedValue(null);

    await expect(reviewPost('missing', { approve: true }, ctx(), { repo })).rejects.toThrow(/not found/i);
  });

  it('tenant-scoping: uses ctx.tenantId', async () => {
    const repo = mock<IPostRepository>();
    const pending = makePost({ tenantId: 'tenant-xyz', status: 'pending_review' });
    repo.findById.mockResolvedValue(pending);
    repo.update.mockResolvedValue(pending);

    await reviewPost(pending.id, { approve: true }, ctx({ tenantId: 'tenant-xyz' }), { repo });

    expect(repo.findById).toHaveBeenCalledWith('tenant-xyz', pending.id);
  });
});
