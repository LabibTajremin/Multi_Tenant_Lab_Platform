import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IPublicationRepository } from '@/domain/repositories/IPublicationRepository';
import type { UseCaseContext } from '../../context';
import { makePublication } from '../../../../tests/fixtures/factories';
import { listPublications } from './ListPublications';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: false, ...overrides };
}

describe('listPublications', () => {
  it('happy path: an authenticated actor gets every publication regardless of status', async () => {
    const repo = mock<IPublicationRepository>();
    const rows = [makePublication({ status: 'draft' }), makePublication({ status: 'published' })];
    repo.listAll.mockResolvedValue(rows);

    const result = await listPublications(ctx(), { repo });

    expect(result).toBe(rows);
  });

  it('permission-denied: public (unauthenticated) callers are rejected before any repo call', async () => {
    const repo = mock<IPublicationRepository>();

    await expect(listPublications(ctx({ actor: null }), { repo })).rejects.toThrow(PermissionError);
    expect(repo.listAll).not.toHaveBeenCalled();
  });

  it('tenant-scoping: passes ctx.tenantId through to the repository', async () => {
    const repo = mock<IPublicationRepository>();
    repo.listAll.mockResolvedValue([]);

    await listPublications(ctx({ tenantId: 'tenant-xyz' }), { repo });

    expect(repo.listAll).toHaveBeenCalledWith('tenant-xyz');
  });
});
