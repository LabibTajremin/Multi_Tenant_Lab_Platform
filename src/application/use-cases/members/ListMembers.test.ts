import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IMemberRepository } from '@/domain/repositories/IMemberRepository';
import { makeMember } from '../../../../tests/fixtures/factories';
import { listMembers } from './ListMembers';

describe('listMembers', () => {
  it('happy path: no RBAC gate — members are always public', async () => {
    const repo = mock<IMemberRepository>();
    repo.listByTenant.mockResolvedValue([makeMember({ position: 'PI' })]);

    const result = await listMembers('tenant-1', { repo });

    expect(result).toHaveLength(1);
  });

  it('sorts PI first, then by position rank, per Section 12 /people ordering', async () => {
    const repo = mock<IMemberRepository>();
    repo.listByTenant.mockResolvedValue([
      makeMember({ fullName: 'Alum', position: 'Alumnus', sortOrder: 0 }),
      makeMember({ fullName: 'Boss', position: 'PI', sortOrder: 0 }),
      makeMember({ fullName: 'Grad', position: 'PhD', sortOrder: 0 }),
    ]);

    const result = await listMembers('tenant-1', { repo });

    expect(result.map((m) => m.fullName)).toEqual(['Boss', 'Grad', 'Alum']);
  });

  it('tenant-scoping: passes tenantId straight through', async () => {
    const repo = mock<IMemberRepository>();
    repo.listByTenant.mockResolvedValue([]);

    await listMembers('tenant-xyz', { repo });

    expect(repo.listByTenant).toHaveBeenCalledWith('tenant-xyz');
  });
});
