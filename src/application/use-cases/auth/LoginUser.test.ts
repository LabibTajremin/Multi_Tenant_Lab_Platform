import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { makeUser } from '../../../../tests/fixtures/factories';
import { loginUser } from './LoginUser';

describe('loginUser', () => {
  it('happy path: returns the user when email exists, is active, and the password matches', async () => {
    const userRepo = mock<IUserRepository>();
    const user = makeUser({ tenantId: 'tenant-1', email: 'pi@example.edu', isActive: true });
    userRepo.findByEmail.mockResolvedValue(user);
    const comparePassword = async () => true;

    const result = await loginUser('tenant-1', { email: 'pi@example.edu', password: 'correct-horse' }, {
      userRepo,
      comparePassword,
    });

    expect(result).toBe(user);
    expect(userRepo.findByEmail).toHaveBeenCalledWith('tenant-1', 'pi@example.edu');
  });

  it('returns null (not an error) when the password does not match', async () => {
    const userRepo = mock<IUserRepository>();
    userRepo.findByEmail.mockResolvedValue(makeUser({ tenantId: 'tenant-1' }));
    const comparePassword = async () => false;

    const result = await loginUser('tenant-1', { email: 'pi@example.edu', password: 'wrong' }, {
      userRepo,
      comparePassword,
    });

    expect(result).toBeNull();
  });

  it('returns null when no user exists for that email in this tenant', async () => {
    const userRepo = mock<IUserRepository>();
    userRepo.findByEmail.mockResolvedValue(null);

    const result = await loginUser('tenant-1', { email: 'nobody@example.edu', password: 'x' }, { userRepo });

    expect(result).toBeNull();
  });

  it('returns null for a deactivated user, even with the correct password', async () => {
    const userRepo = mock<IUserRepository>();
    userRepo.findByEmail.mockResolvedValue(makeUser({ tenantId: 'tenant-1', isActive: false }));
    const comparePassword = async () => true;

    const result = await loginUser('tenant-1', { email: 'x@example.edu', password: 'correct' }, {
      userRepo,
      comparePassword,
    });

    expect(result).toBeNull();
  });

  it('rejects malformed input (validation failure) before touching the repository', async () => {
    const userRepo = mock<IUserRepository>();

    await expect(loginUser('tenant-1', { email: 'not-an-email', password: '' }, { userRepo })).rejects.toThrow();

    expect(userRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('always scopes the lookup to the given tenantId', async () => {
    const userRepo = mock<IUserRepository>();
    userRepo.findByEmail.mockResolvedValue(null);

    await loginUser('tenant-xyz', { email: 'x@example.edu', password: 'x' }, { userRepo });

    expect(userRepo.findByEmail).toHaveBeenCalledWith('tenant-xyz', 'x@example.edu');
  });
});
