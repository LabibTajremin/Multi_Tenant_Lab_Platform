import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Tenant } from '@/domain/entities/Tenant';
import type { User } from '@/domain/entities/User';
import type { ITenantRepository } from '@/domain/repositories/ITenantRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import type { ISiteSettingsRepository } from '@/domain/repositories/ISiteSettingsRepository';

export interface ProvisionTenantInput {
  labName: string;
  slug: string;
  university?: string | null;
  adminEmail: string;
  adminDisplayName: string;
  theme?: string;
  primaryColor?: string | null;
}

export interface ProvisionTenantDeps {
  tenantRepo: ITenantRepository;
  userRepo: IUserRepository;
  siteSettingsRepo: ISiteSettingsRepository;
  /** Injectable for tests; defaults to a real bcrypt hash. */
  hashPassword?: (plain: string) => Promise<string>;
  /** Injectable for tests; defaults to a cryptographically random 24-char password. */
  generatePassword?: () => string;
}

export interface ProvisionTenantResult {
  tenant: Tenant;
  admin: User;
  /** Never persisted in plaintext anywhere — the caller must print/display it
   * exactly once and then discard it (Section 5). */
  temporaryPassword: string;
}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function defaultGeneratePassword(): string {
  return randomBytes(18).toString('base64url');
}

function defaultHashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

/**
 * Bootstraps a brand-new tenant deployment (Section 5): creates the tenant row,
 * a default site_settings row, and the first Admin account with a random
 * temporary password and must_reset_password enforced. This is what makes "the
 * system creates the first Admin automatically" true — a human operator triggers
 * it, but a hand-written SQL INSERT never does.
 */
export async function provisionTenant(
  input: ProvisionTenantInput,
  deps: ProvisionTenantDeps,
): Promise<ProvisionTenantResult> {
  if (!SLUG_PATTERN.test(input.slug)) {
    throw new Error(`Invalid slug "${input.slug}": use lowercase letters, digits, and hyphens only.`);
  }

  const existing = await deps.tenantRepo.findBySlug(input.slug);
  if (existing) {
    throw new Error(`A tenant with slug "${input.slug}" already exists.`);
  }

  const tenant = await deps.tenantRepo.create({
    slug: input.slug,
    labName: input.labName,
    university: input.university ?? null,
    theme: input.theme,
    primaryColor: input.primaryColor ?? null,
  });

  await deps.siteSettingsRepo.upsert(tenant.id, { contactEmail: input.adminEmail });

  const generatePassword = deps.generatePassword ?? defaultGeneratePassword;
  const hashPassword = deps.hashPassword ?? defaultHashPassword;
  const temporaryPassword = generatePassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const admin = await deps.userRepo.create({
    tenantId: tenant.id,
    email: input.adminEmail,
    passwordHash,
    role: 'admin',
    displayName: input.adminDisplayName,
    mustResetPassword: true,
  });

  return { tenant, admin, temporaryPassword };
}
