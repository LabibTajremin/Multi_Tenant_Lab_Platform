import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IMemberRepository } from '@/domain/repositories/IMemberRepository';
import type { UseCaseContext } from '../../context';
import { makeMember } from '../../../../tests/fixtures/factories';
import { createMemberProfile } from './CreateMemberProfile';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };
const editor = { id: 'editor-1', role: 'editor' as const };
const validInput = { fullName: 'Ada Lovelace', position: 'PhD' };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: false, ...overrides };
}

describe('createMemberProfile', () => {
  it('happy path: Admin creates a member profile', async () => {
    const repo = mock<IMemberRepository>();
    repo.create.mockResolvedValue(makeMember());

    await createMemberProfile(validInput, ctx(), { repo });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'Ada Lovelace', position: 'PhD' }));
  });

  it('permission-denied: an Editor cannot create a member profile (Section 6: Admin-only)', async () => {
    const repo = mock<IMemberRepository>();

    await expect(createMemberProfile(validInput, ctx({ actor: editor }), { repo })).rejects.toThrow(PermissionError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('permission-denied: public actor cannot create a member profile', async () => {
    const repo = mock<IMemberRepository>();

    await expect(createMemberProfile(validInput, ctx({ actor: null }), { repo })).rejects.toThrow(PermissionError);
  });

  it('validation failure: rejects an unknown position', async () => {
    const repo = mock<IMemberRepository>();

    await expect(
      createMemberProfile({ fullName: 'X', position: 'Professor' }, ctx(), { repo }),
    ).rejects.toThrow();
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('validation failure: rejects a photo without alt text', async () => {
    const repo = mock<IMemberRepository>();

    await expect(
      createMemberProfile({ ...validInput, photoUrl: 'https://example.edu/x.png' }, ctx(), { repo }),
    ).rejects.toThrow();
  });

  it('tenant-scoping: uses ctx.tenantId', async () => {
    const repo = mock<IMemberRepository>();
    repo.create.mockResolvedValue(makeMember());

    await createMemberProfile(validInput, ctx({ tenantId: 'tenant-xyz' }), { repo });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-xyz' }));
  });
});
