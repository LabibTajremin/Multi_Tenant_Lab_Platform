import type { User } from '@/domain/entities/User';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { canManageUsers } from '@/lib/rbac';
import type { UseCaseContext } from '../../context';
import { PermissionError } from '../../errors';

export interface SetUserActiveDeps {
  userRepo: IUserRepository;
}

/** Section 13 /admin/users: Admin-only deactivate/reactivate. */
export async function setUserActive(
  userId: string,
  isActive: boolean,
  ctx: UseCaseContext,
  deps: SetUserActiveDeps,
): Promise<User> {
  if (!canManageUsers(ctx.actor)) {
    throw new PermissionError('Only an Admin can change an account\'s active status.');
  }
  return deps.userRepo.update(ctx.tenantId, userId, { isActive });
}
