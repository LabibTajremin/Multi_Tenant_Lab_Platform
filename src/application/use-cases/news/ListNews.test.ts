import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { INewsRepository } from '@/domain/repositories/INewsRepository';
import type { UseCaseContext } from '../../context';
import { makeNewsItem } from '../../../../tests/fixtures/factories';
import { listNews } from './ListNews';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: false, ...overrides };
}

describe('listNews', () => {
  it('happy path: authenticated actor sees every status', async () => {
    const repo = mock<INewsRepository>();
    const rows = [makeNewsItem({ status: 'draft' })];
    repo.listAll.mockResolvedValue(rows);

    expect(await listNews(ctx(), { repo })).toBe(rows);
  });

  it('permission-denied: public callers rejected before any repo call', async () => {
    const repo = mock<INewsRepository>();

    await expect(listNews(ctx({ actor: null }), { repo })).rejects.toThrow(PermissionError);
    expect(repo.listAll).not.toHaveBeenCalled();
  });

  it('tenant-scoping: uses ctx.tenantId', async () => {
    const repo = mock<INewsRepository>();
    repo.listAll.mockResolvedValue([]);

    await listNews(ctx({ tenantId: 'tenant-xyz' }), { repo });

    expect(repo.listAll).toHaveBeenCalledWith('tenant-xyz');
  });
});
