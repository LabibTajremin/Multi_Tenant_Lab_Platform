import bcrypt from 'bcryptjs';
import type { User } from '@/domain/entities/User';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { loginSchema } from '../../dtos/authDtos';
import { ValidationError } from '../../errors';

export interface LoginUserDeps {
  userRepo: IUserRepository;
  comparePassword?: (plain: string, hash: string) => Promise<boolean>;
}

/**
 * The single source of truth for verifying credentials — Auth.js's
 * CredentialsProvider.authorize() in infrastructure/auth/authOptions.ts calls
 * this rather than re-implementing the check, so it's unit-testable without
 * spinning up NextAuth at all.
 */
export async function loginUser(tenantId: string, input: unknown, deps: LoginUserDeps): Promise<User | null> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError('Invalid login input', parsed.error.issues.map((i) => i.message));
  }

  const user = await deps.userRepo.findByEmail(tenantId, parsed.data.email);
  if (!user || !user.isActive) {
    return null;
  }

  const compare = deps.comparePassword ?? bcrypt.compare;
  const passwordMatches = await compare(parsed.data.password, user.passwordHash);
  if (!passwordMatches) {
    return null;
  }

  return user;
}
