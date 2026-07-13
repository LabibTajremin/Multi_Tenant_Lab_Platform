import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IPostRepository } from '@/domain/repositories/IPostRepository';
import type { UseCaseContext } from '../../context';
import { makePost } from '../../../../tests/fixtures/factories';
import { listPosts } from './ListPosts';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: false, ...overrides };
}

describe('listPosts', () => {
  it('happy path: authenticated actor sees every status', async () => {
    const repo = mock<IPostRepository>();
    const rows = [makePost({ status: 'draft' })];
    repo.listAll.mockResolvedValue(rows);

    expect(await listPosts(ctx(), { repo })).toBe(rows);
  });

  it('permission-denied: public callers rejected before any repo call', async () => {
    const repo = mock<IPostRepository>();

    await expect(listPosts(ctx({ actor: null }), { repo })).rejects.toThrow(PermissionError);
    expect(repo.listAll).not.toHaveBeenCalled();
  });

  it('tenant-scoping: uses ctx.tenantId and forwards the optional postType filter', async () => {
    const repo = mock<IPostRepository>();
    repo.listAll.mockResolvedValue([]);

    await listPosts(ctx({ tenantId: 'tenant-xyz' }), { repo }, 'gallery');

    expect(repo.listAll).toHaveBeenCalledWith('tenant-xyz', 'gallery');
  });
});
