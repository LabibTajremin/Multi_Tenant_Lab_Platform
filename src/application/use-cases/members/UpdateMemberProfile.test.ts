import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IMemberRepository } from '@/domain/repositories/IMemberRepository';
import type { UseCaseContext } from '../../context';
import { makeMember } from '../../../../tests/fixtures/factories';
import { updateMemberProfile } from './UpdateMemberProfile';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };
const editor = { id: 'editor-1', role: 'editor' as const };
const otherEditor = { id: 'editor-2', role: 'editor' as const };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: false, ...overrides };
}

describe('updateMemberProfile', () => {
  it('happy path: Admin can change structural fields like position', async () => {
    const repo = mock<IMemberRepository>();
    const existing = makeMember({ tenantId: 'tenant-1', userId: null });
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await updateMemberProfile(existing.id, { position: 'Postdoc' }, ctx(), { repo });

    expect(repo.update).toHaveBeenCalledWith('tenant-1', existing.id, expect.objectContaining({ position: 'Postdoc' }));
  });

  it('happy path: a member can edit their own bio', async () => {
    const repo = mock<IMemberRepository>();
    const existing = makeMember({ tenantId: 'tenant-1', userId: editor.id });
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await updateMemberProfile(existing.id, { bio: 'Updated bio' }, ctx({ actor: editor }), { repo });

    expect(repo.update).toHaveBeenCalledWith('tenant-1', existing.id, expect.objectContaining({ bio: 'Updated bio' }));
  });

  it('permission-denied: an Editor cannot edit a different member\'s profile', async () => {
    const repo = mock<IMemberRepository>();
    const existing = makeMember({ tenantId: 'tenant-1', userId: otherEditor.id });
    repo.findById.mockResolvedValue(existing);

    await expect(
      updateMemberProfile(existing.id, { bio: 'x' }, ctx({ actor: editor }), { repo }),
    ).rejects.toThrow(PermissionError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('permission-denied: an Editor cannot edit a login-less (alumni) profile', async () => {
    const repo = mock<IMemberRepository>();
    const existing = makeMember({ tenantId: 'tenant-1', userId: null });
    repo.findById.mockResolvedValue(existing);

    await expect(
      updateMemberProfile(existing.id, { bio: 'x' }, ctx({ actor: editor }), { repo }),
    ).rejects.toThrow(PermissionError);
  });

  it('a member editing their own profile cannot change structural fields like position (silently ignored)', async () => {
    const repo = mock<IMemberRepository>();
    const existing = makeMember({ tenantId: 'tenant-1', userId: editor.id, position: 'PhD' });
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await updateMemberProfile(existing.id, { bio: 'x', position: 'PI' }, ctx({ actor: editor }), { repo });

    const patch = repo.update.mock.calls[0]?.[2];
    expect(patch).not.toHaveProperty('position');
  });

  it('validation failure: rejects an out-of-range field before touching the repo', async () => {
    const repo = mock<IMemberRepository>();
    const existing = makeMember({ tenantId: 'tenant-1', userId: null });
    repo.findById.mockResolvedValue(existing);

    await expect(updateMemberProfile(existing.id, { contactEmail: 'not-an-email' }, ctx(), { repo })).rejects.toThrow();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('not found: throws when the member does not exist', async () => {
    const repo = mock<IMemberRepository>();
    repo.findById.mockResolvedValue(null);

    await expect(updateMemberProfile('missing', { bio: 'x' }, ctx(), { repo })).rejects.toThrow(/not found/i);
  });

  it('tenant-scoping: uses ctx.tenantId', async () => {
    const repo = mock<IMemberRepository>();
    const existing = makeMember({ tenantId: 'tenant-xyz', userId: null });
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await updateMemberProfile(existing.id, { bio: 'x' }, ctx({ tenantId: 'tenant-xyz' }), { repo });

    expect(repo.findById).toHaveBeenCalledWith('tenant-xyz', existing.id);
  });
});
