import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IMemberRepository } from '@/domain/repositories/IMemberRepository';
import type { UseCaseContext } from '../../context';
import { makeMember } from '../../../../tests/fixtures/factories';
import { deleteMemberProfile } from './DeleteMemberProfile';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };
const editor = { id: 'editor-1', role: 'editor' as const };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: false, ...overrides };
}

describe('deleteMemberProfile', () => {
  it('happy path: Admin deletes a member profile', async () => {
    const repo = mock<IMemberRepository>();
    const existing = makeMember({ tenantId: 'tenant-1' });
    repo.findById.mockResolvedValue(existing);

    await deleteMemberProfile(existing.id, ctx(), { repo });

    expect(repo.delete).toHaveBeenCalledWith('tenant-1', existing.id);
  });

  it('permission-denied: an Editor cannot delete even their own member profile', async () => {
    const repo = mock<IMemberRepository>();
    const existing = makeMember({ tenantId: 'tenant-1', userId: editor.id });
    repo.findById.mockResolvedValue(existing);

    await expect(deleteMemberProfile(existing.id, ctx({ actor: editor }), { repo })).rejects.toThrow(PermissionError);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('not found: throws when the member does not exist', async () => {
    const repo = mock<IMemberRepository>();
    repo.findById.mockResolvedValue(null);

    await expect(deleteMemberProfile('missing', ctx(), { repo })).rejects.toThrow(/not found/i);
  });

  it('tenant-scoping: uses ctx.tenantId', async () => {
    const repo = mock<IMemberRepository>();
    const existing = makeMember({ tenantId: 'tenant-xyz' });
    repo.findById.mockResolvedValue(existing);

    await deleteMemberProfile(existing.id, ctx({ tenantId: 'tenant-xyz' }), { repo });

    expect(repo.delete).toHaveBeenCalledWith('tenant-xyz', existing.id);
  });
});
