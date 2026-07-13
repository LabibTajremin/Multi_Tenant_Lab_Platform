import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { User } from '@/domain/entities/User';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { canManageUsers } from '@/lib/rbac';
import type { UseCaseContext } from '../../context';
import { createEditorSchema } from '../../dtos/authDtos';
import { ConflictError, PermissionError, ValidationError } from '../../errors';

export interface CreateEditorDeps {
  userRepo: IUserRepository;
  hashPassword?: (plain: string) => Promise<string>;
  generatePassword?: () => string;
}

export interface CreateEditorResult {
  user: User;
  temporaryPassword: string;
}

function defaultGeneratePassword(): string {
  return randomBytes(18).toString('base64url');
}

/** Section 13 /admin/users: Admin-only creation of a new Editor account, with the
 * same forced-password-reset semantics as the initial provisioning Admin. */
export async function createEditor(
  input: unknown,
  ctx: UseCaseContext,
  deps: CreateEditorDeps,
): Promise<CreateEditorResult> {
  if (!canManageUsers(ctx.actor)) {
    throw new PermissionError('Only an Admin can create Editor accounts.');
  }

  const parsed = createEditorSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError('Invalid editor input', parsed.error.issues.map((i) => i.message));
  }

  const existing = await deps.userRepo.findByEmail(ctx.tenantId, parsed.data.email);
  if (existing) {
    throw new ConflictError(`A user with email "${parsed.data.email}" already exists.`);
  }

  const generatePassword = deps.generatePassword ?? defaultGeneratePassword;
  const hashPassword = deps.hashPassword ?? ((plain: string) => bcrypt.hash(plain, 12));
  const temporaryPassword = generatePassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const user = await deps.userRepo.create({
    tenantId: ctx.tenantId,
    email: parsed.data.email,
    passwordHash,
    role: 'editor',
    displayName: parsed.data.displayName,
    mustResetPassword: true,
    createdBy: ctx.actor!.id,
  });

  return { user, temporaryPassword };
}
