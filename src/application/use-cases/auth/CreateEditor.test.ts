import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { makeUser } from '../../../../tests/fixtures/factories';
import { createEditor } from './CreateEditor';
import type { UseCaseContext } from '../../context';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };
const editor = { id: 'editor-1', role: 'editor' as const };

function ctxFor(actor: typeof admin | typeof editor | null, tenantId = 'tenant-1'): UseCaseContext {
  return { actor, tenantId, reviewEnabled: false };
}

describe('createEditor', () => {
  it('happy path: Admin creates a new Editor with a temp password and mustResetPassword', async () => {
    const userRepo = mock<IUserRepository>();
    userRepo.findByEmail.mockResolvedValue(null);
    const created = makeUser({ tenantId: 'tenant-1', email: 'new@example.edu', role: 'editor' });
    userRepo.create.mockResolvedValue(created);

    const result = await createEditor(
      { email: 'new@example.edu', displayName: 'New Editor' },
      ctxFor(admin),
      { userRepo, generatePassword: () => 'temp-pass', hashPassword: async (p) => `hashed:${p}` },
    );

    expect(result.user).toBe(created);
    expect(result.temporaryPassword).toBe('temp-pass');
    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        email: 'new@example.edu',
        role: 'editor',
        mustResetPassword: true,
        createdBy: admin.id,
      }),
    );
  });

  it('permission-denied: an Editor cannot create another Editor', async () => {
    const userRepo = mock<IUserRepository>();

    await expect(
      createEditor({ email: 'x@example.edu', displayName: 'X' }, ctxFor(editor), { userRepo }),
    ).rejects.toThrow(PermissionError);

    expect(userRepo.findByEmail).not.toHaveBeenCalled();
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('permission-denied: a public (unauthenticated) actor cannot create an Editor', async () => {
    const userRepo = mock<IUserRepository>();

    await expect(
      createEditor({ email: 'x@example.edu', displayName: 'X' }, ctxFor(null), { userRepo }),
    ).rejects.toThrow(PermissionError);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('validation failure: rejects a malformed email before touching the repository', async () => {
    const userRepo = mock<IUserRepository>();

    await expect(
      createEditor({ email: 'not-an-email', displayName: 'X' }, ctxFor(admin), { userRepo }),
    ).rejects.toThrow();
    expect(userRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('rejects a duplicate email within the same tenant', async () => {
    const userRepo = mock<IUserRepository>();
    userRepo.findByEmail.mockResolvedValue(makeUser({ email: 'dup@example.edu' }));

    await expect(
      createEditor({ email: 'dup@example.edu', displayName: 'X' }, ctxFor(admin), { userRepo }),
    ).rejects.toThrow(/already exists/);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('tenant-scoping: passes ctx.tenantId through to both the lookup and the create call', async () => {
    const userRepo = mock<IUserRepository>();
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.create.mockResolvedValue(makeUser());

    await createEditor({ email: 'x@example.edu', displayName: 'X' }, ctxFor(admin, 'tenant-zzz'), { userRepo });

    expect(userRepo.findByEmail).toHaveBeenCalledWith('tenant-zzz', 'x@example.edu');
    expect(userRepo.create).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-zzz' }));
  });
});
