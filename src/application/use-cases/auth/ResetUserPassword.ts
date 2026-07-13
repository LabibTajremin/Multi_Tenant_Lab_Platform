import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { canManageUsers } from '@/lib/rbac';
import type { UseCaseContext } from '../../context';
import { PermissionError } from '../../errors';

export interface ResetUserPasswordDeps {
  userRepo: IUserRepository;
  hashPassword?: (plain: string) => Promise<string>;
  generatePassword?: () => string;
}

function defaultGeneratePassword(): string {
  return randomBytes(18).toString('base64url');
}

/** Section 13 /admin/users: Admin-only "reset a forgotten password" — generates
 * a new temp password + forces reset on next login, same as first provisioning. */
export async function resetUserPassword(
  userId: string,
  ctx: UseCaseContext,
  deps: ResetUserPasswordDeps,
): Promise<{ temporaryPassword: string }> {
  if (!canManageUsers(ctx.actor)) {
    throw new PermissionError('Only an Admin can reset another user\'s password.');
  }

  const generatePassword = deps.generatePassword ?? defaultGeneratePassword;
  const hashPassword = deps.hashPassword ?? ((plain: string) => bcrypt.hash(plain, 12));
  const temporaryPassword = generatePassword();
  const passwordHash = await hashPassword(temporaryPassword);

  await deps.userRepo.setPasswordHash(ctx.tenantId, userId, passwordHash, true);

  return { temporaryPassword };
}
