import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { ITenantRepository } from '@/domain/repositories/ITenantRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import type { ISiteSettingsRepository } from '@/domain/repositories/ISiteSettingsRepository';
import { makeTenant, makeUser, makeSiteSettings } from '../../../../tests/fixtures/factories';
import { provisionTenant } from './ProvisionTenant';

function makeDeps() {
  const tenantRepo = mock<ITenantRepository>();
  const userRepo = mock<IUserRepository>();
  const siteSettingsRepo = mock<ISiteSettingsRepository>();
  return { tenantRepo, userRepo, siteSettingsRepo };
}

const input = {
  labName: 'Tang Polymer Lab',
  slug: 'tangpolymer',
  university: 'State University',
  adminEmail: 'pi@example.edu',
  adminDisplayName: 'Dr. Tang',
};

describe('provisionTenant', () => {
  it('happy path: creates the tenant, default site settings, and a must-reset Admin', async () => {
    const { tenantRepo, userRepo, siteSettingsRepo } = makeDeps();
    tenantRepo.findBySlug.mockResolvedValue(null);
    const tenant = makeTenant({ slug: input.slug, labName: input.labName });
    tenantRepo.create.mockResolvedValue(tenant);
    siteSettingsRepo.upsert.mockResolvedValue(makeSiteSettings({ tenantId: tenant.id }));
    const admin = makeUser({ tenantId: tenant.id, email: input.adminEmail, role: 'admin', mustResetPassword: true });
    userRepo.create.mockResolvedValue(admin);

    const result = await provisionTenant(input, {
      tenantRepo,
      userRepo,
      siteSettingsRepo,
      generatePassword: () => 'fixed-temp-password',
      hashPassword: async (plain) => `hashed:${plain}`,
    });

    expect(result.tenant).toBe(tenant);
    expect(result.admin).toBe(admin);
    expect(result.temporaryPassword).toBe('fixed-temp-password');

    expect(tenantRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: input.slug, labName: input.labName }),
    );
    expect(siteSettingsRepo.upsert).toHaveBeenCalledWith(tenant.id, expect.objectContaining({ contactEmail: input.adminEmail }));
    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: tenant.id,
        email: input.adminEmail,
        role: 'admin',
        mustResetPassword: true,
        passwordHash: 'hashed:fixed-temp-password',
      }),
    );
  });

  it('rejects a slug that is already taken, without creating anything', async () => {
    const { tenantRepo, userRepo, siteSettingsRepo } = makeDeps();
    tenantRepo.findBySlug.mockResolvedValue(makeTenant({ slug: input.slug }));

    await expect(provisionTenant(input, { tenantRepo, userRepo, siteSettingsRepo })).rejects.toThrow(/already exists/);

    expect(tenantRepo.create).not.toHaveBeenCalled();
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid slug before touching any repository', async () => {
    const { tenantRepo, userRepo, siteSettingsRepo } = makeDeps();

    await expect(
      provisionTenant({ ...input, slug: 'Not A Valid Slug!' }, { tenantRepo, userRepo, siteSettingsRepo }),
    ).rejects.toThrow(/Invalid slug/);

    expect(tenantRepo.findBySlug).not.toHaveBeenCalled();
    expect(tenantRepo.create).not.toHaveBeenCalled();
  });

  it('generates a fresh random password by default (not a constant)', async () => {
    const { tenantRepo, userRepo, siteSettingsRepo } = makeDeps();
    tenantRepo.findBySlug.mockResolvedValue(null);
    tenantRepo.create.mockResolvedValue(makeTenant({ slug: input.slug }));
    siteSettingsRepo.upsert.mockResolvedValue(makeSiteSettings());
    userRepo.create.mockResolvedValue(makeUser());

    const hashPassword = vi.fn(async (plain: string) => `hashed:${plain}`);
    const first = await provisionTenant(input, { tenantRepo, userRepo, siteSettingsRepo, hashPassword });
    const second = await provisionTenant(input, { tenantRepo, userRepo, siteSettingsRepo, hashPassword });

    expect(first.temporaryPassword).not.toBe(second.temporaryPassword);
    expect(first.temporaryPassword.length).toBeGreaterThanOrEqual(16);
  });
});
