import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import type { UseCaseContext } from '../../context';
import { resetUserPassword } from './ResetUserPassword';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };
const editor = { id: 'editor-1', role: 'editor' as const };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: false, ...overrides };
}

describe('resetUserPassword', () => {
  it('happy path: Admin resets a password and forces reset on next login', async () => {
    const userRepo = mock<IUserRepository>();

    const result = await resetUserPassword('user-1', ctx(), {
      userRepo,
      generatePassword: () => 'temp-pass',
      hashPassword: async (p) => `hashed:${p}`,
    });

    expect(result.temporaryPassword).toBe('temp-pass');
    expect(userRepo.setPasswordHash).toHaveBeenCalledWith('tenant-1', 'user-1', 'hashed:temp-pass', true);
  });

  it('permission-denied: an Editor cannot reset another user\'s password', async () => {
    const userRepo = mock<IUserRepository>();

    await expect(resetUserPassword('user-1', ctx({ actor: editor }), { userRepo })).rejects.toThrow(PermissionError);
    expect(userRepo.setPasswordHash).not.toHaveBeenCalled();
  });

  it('tenant-scoping: uses ctx.tenantId', async () => {
    const userRepo = mock<IUserRepository>();

    await resetUserPassword('user-1', ctx({ tenantId: 'tenant-xyz' }), { userRepo });

    expect(userRepo.setPasswordHash).toHaveBeenCalledWith('tenant-xyz', 'user-1', expect.any(String), true);
  });
});
