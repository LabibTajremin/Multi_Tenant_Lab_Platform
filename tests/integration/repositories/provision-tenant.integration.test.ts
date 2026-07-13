import { describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import { provisionTenant } from '@/application/use-cases/tenants/ProvisionTenant';
import { PostgresTenantRepository } from '@/infrastructure/repositories/PostgresTenantRepository';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { PostgresSiteSettingsRepository } from '@/infrastructure/repositories/PostgresSiteSettingsRepository';

describe('provisionTenant against a real database (Section 16 build order, step 7)', () => {
  it('creates a tenant, a default site_settings row, and a must-reset Admin with a working temporary password', async () => {
    const unique = `provision-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tenantRepo = new PostgresTenantRepository();
    const userRepo = new PostgresUserRepository();
    const siteSettingsRepo = new PostgresSiteSettingsRepository();

    const result = await provisionTenant(
      {
        labName: `${unique} Lab`,
        slug: unique,
        university: 'Test University',
        adminEmail: `pi@${unique}.edu`,
        adminDisplayName: 'Dr. Test',
      },
      { tenantRepo, userRepo, siteSettingsRepo },
    );

    expect(result.tenant.slug).toBe(unique);
    expect(result.admin.email).toBe(`pi@${unique}.edu`);
    expect(result.admin.role).toBe('admin');
    expect(result.admin.mustResetPassword).toBe(true);
    expect(result.temporaryPassword.length).toBeGreaterThanOrEqual(16);

    const tenantRow = await tenantRepo.findById(result.tenant.id);
    expect(tenantRow).not.toBeNull();

    const settings = await siteSettingsRepo.getByTenant(result.tenant.id);
    expect(settings).not.toBeNull();
    expect(settings?.contactEmail).toBe(`pi@${unique}.edu`);

    const adminRow = await userRepo.findById(result.tenant.id, result.admin.id);
    expect(adminRow).not.toBeNull();
    expect(adminRow?.passwordHash).not.toBe(result.temporaryPassword);
    await expect(bcrypt.compare(result.temporaryPassword, adminRow!.passwordHash)).resolves.toBe(true);
  });

  it('refuses to provision a second tenant with an already-taken slug', async () => {
    const unique = `provision-dup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tenantRepo = new PostgresTenantRepository();
    const userRepo = new PostgresUserRepository();
    const siteSettingsRepo = new PostgresSiteSettingsRepository();

    const deps = { tenantRepo, userRepo, siteSettingsRepo };
    const first = {
      labName: `${unique} Lab`,
      slug: unique,
      adminEmail: `pi@${unique}.edu`,
      adminDisplayName: 'Dr. Test',
    };

    await provisionTenant(first, deps);

    await expect(
      provisionTenant({ ...first, adminEmail: `other@${unique}.edu` }, deps),
    ).rejects.toThrow(/already exists/);
  });
});
