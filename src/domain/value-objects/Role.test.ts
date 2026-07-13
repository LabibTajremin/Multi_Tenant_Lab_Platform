import { describe, expect, it } from 'vitest';
import { isAdmin, isEditor, isRole, ROLES } from './Role';

describe('Role value object', () => {
  it('lists exactly admin and editor', () => {
    expect(ROLES).toEqual(['admin', 'editor']);
  });

  it.each(['admin', 'editor'])('recognizes %s as a valid role', (value) => {
    expect(isRole(value)).toBe(true);
  });

  it('rejects an unknown role string', () => {
    expect(isRole('superuser')).toBe(false);
  });

  it('isAdmin/isEditor classify correctly', () => {
    expect(isAdmin('admin')).toBe(true);
    expect(isAdmin('editor')).toBe(false);
    expect(isEditor('editor')).toBe(true);
    expect(isEditor('admin')).toBe(false);
  });
});
