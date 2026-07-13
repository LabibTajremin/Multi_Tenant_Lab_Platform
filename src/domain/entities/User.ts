import type { Role } from '../value-objects/Role';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  role: Role;
  displayName: string;
  mustResetPassword: boolean;
  isActive: boolean;
  createdBy: string | null;
  createdAt: Date;
}
