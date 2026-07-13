import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { INewsRepository } from '@/domain/repositories/INewsRepository';
import type { UseCaseContext } from '../../context';
import { makeNewsItem } from '../../../../tests/fixtures/factories';
import { reviewNewsItem } from './ApproveNewsItem';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };
const editor = { id: 'editor-1', role: 'editor' as const };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: true, ...overrides };
}

describe('reviewNewsItem (approve/reject)', () => {
  it('happy path: Admin approves a pending item', async () => {
    const repo = mock<INewsRepository>();
    const pending = makeNewsItem({ tenantId: 'tenant-1', status: 'pending_review' });
    repo.findById.mockResolvedValue(pending);
    repo.update.mockResolvedValue({ ...pending, status: 'published' });

    await reviewNewsItem(pending.id, { approve: true }, ctx(), { repo });

    expect(repo.update).toHaveBeenCalledWith(
      'tenant-1',
      pending.id,
      expect.objectContaining({ status: 'published', reviewedBy: admin.id }),
    );
  });

  it('permission-denied: an Editor cannot approve, even their own', async () => {
    const repo = mock<INewsRepository>();
    const pending = makeNewsItem({ tenantId: 'tenant-1', createdBy: editor.id, status: 'pending_review' });
    repo.findById.mockResolvedValue(pending);

    await expect(reviewNewsItem(pending.id, { approve: true }, ctx({ actor: editor }), { repo })).rejects.toThrow(
      PermissionError,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('validation failure: rejecting without a note is refused', async () => {
    const repo = mock<INewsRepository>();
    const pending = makeNewsItem({ tenantId: 'tenant-1', status: 'pending_review' });
    repo.findById.mockResolvedValue(pending);

    await expect(reviewNewsItem(pending.id, { approve: false, note: '' }, ctx(), { repo })).rejects.toThrow();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('not found: throws for a missing news item', async () => {
    const repo = mock<INewsRepository>();
    repo.findById.mockResolvedValue(null);

    await expect(reviewNewsItem('missing', { approve: true }, ctx(), { repo })).rejects.toThrow(/not found/i);
  });

  it('tenant-scoping: uses ctx.tenantId', async () => {
    const repo = mock<INewsRepository>();
    const pending = makeNewsItem({ tenantId: 'tenant-xyz', status: 'pending_review' });
    repo.findById.mockResolvedValue(pending);
    repo.update.mockResolvedValue(pending);

    await reviewNewsItem(pending.id, { approve: true }, ctx({ tenantId: 'tenant-xyz' }), { repo });

    expect(repo.findById).toHaveBeenCalledWith('tenant-xyz', pending.id);
  });
});
