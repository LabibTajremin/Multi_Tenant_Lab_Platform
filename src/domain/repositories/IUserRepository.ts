import type { User } from '../entities/User';
import type { Role } from '../value-objects/Role';

export interface NewUserInput {
  tenantId: string;
  email: string;
  passwordHash: string;
  role: Role;
  displayName: string;
  mustResetPassword?: boolean;
  createdBy?: string | null;
}

export interface UserPatch {
  displayName?: string;
  role?: Role;
  isActive?: boolean;
}

/** Every method is scoped to a single tenant — never a cross-tenant lookup by user id alone. */
export interface IUserRepository {
  findById(tenantId: string, id: string): Promise<User | null>;
  findByEmail(tenantId: string, email: string): Promise<User | null>;
  listByTenant(tenantId: string): Promise<User[]>;
  create(input: NewUserInput): Promise<User>;
  update(tenantId: string, id: string, patch: UserPatch): Promise<User>;
  setPasswordHash(tenantId: string, id: string, passwordHash: string, mustResetPassword: boolean): Promise<void>;
}
