import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import type { UseCaseContext } from '../../context';
import { makeUser } from '../../../../tests/fixtures/factories';
import { setUserActive } from './SetUserActive';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };
const editor = { id: 'editor-1', role: 'editor' as const };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: false, ...overrides };
}

describe('setUserActive', () => {
  it('happy path: Admin deactivates a user', async () => {
    const userRepo = mock<IUserRepository>();
    userRepo.update.mockResolvedValue(makeUser({ isActive: false }));

    await setUserActive('user-1', false, ctx(), { userRepo });

    expect(userRepo.update).toHaveBeenCalledWith('tenant-1', 'user-1', { isActive: false });
  });

  it('permission-denied: an Editor cannot deactivate accounts', async () => {
    const userRepo = mock<IUserRepository>();

    await expect(setUserActive('user-1', false, ctx({ actor: editor }), { userRepo })).rejects.toThrow(
      PermissionError,
    );
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('tenant-scoping: uses ctx.tenantId', async () => {
    const userRepo = mock<IUserRepository>();
    userRepo.update.mockResolvedValue(makeUser());

    await setUserActive('user-1', true, ctx({ tenantId: 'tenant-xyz' }), { userRepo });

    expect(userRepo.update).toHaveBeenCalledWith('tenant-xyz', 'user-1', { isActive: true });
  });
});
