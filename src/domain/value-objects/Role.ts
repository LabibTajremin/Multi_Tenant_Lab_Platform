export type Role = 'admin' | 'editor';

export const ROLES: readonly Role[] = ['admin', 'editor'];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function isAdmin(role: Role): boolean {
  return role === 'admin';
}

export function isEditor(role: Role): boolean {
  return role === 'editor';
}
