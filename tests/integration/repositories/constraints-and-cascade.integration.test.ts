import { describe, expect, it } from 'vitest';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { PostgresMemberRepository } from '@/infrastructure/repositories/PostgresMemberRepository';
import { PostgresSiteSettingsRepository } from '@/infrastructure/repositories/PostgresSiteSettingsRepository';
import { getPool } from '@/infrastructure/db/client';
import { seedTenant } from '../helpers/seedTenants';

describe('schema constraints (Section 15.3: FK, unique, cascade)', () => {
  it('enforces UNIQUE(tenant_id, email) on users, but allows the same email across different tenants', async () => {
    const seeded = await seedTenant('constraints-users');
    const users = new PostgresUserRepository();

    await expect(
      users.create({
        tenantId: seeded.tenant.id,
        email: seeded.admin.email,
        passwordHash: 'x',
        role: 'editor',
        displayName: 'Duplicate',
      }),
    ).rejects.toThrow();

    const otherTenant = await seedTenant('constraints-users-other');
    const sameEmailDifferentTenant = await users.create({
      tenantId: otherTenant.tenant.id,
      email: seeded.admin.email,
      passwordHash: 'x',
      role: 'editor',
      displayName: 'Same email, different lab',
    });
    expect(sameEmailDifferentTenant.email).toBe(seeded.admin.email);
  });

  it('enforces UNIQUE(member_id, platform_id) on member_links', async () => {
    const seeded = await seedTenant('constraints-links');
    const members = new PostgresMemberRepository();

    await members.setLinks(seeded.tenant.id, seeded.member.id, [
      { platform: 'website', url: 'https://example.edu/a' },
    ]);

    await expect(
      members.setLinks(seeded.tenant.id, seeded.member.id, [
        { platform: 'website', url: 'https://example.edu/a' },
        { platform: 'website', url: 'https://example.edu/b' },
      ]),
    ).rejects.toThrow();
  });

  it('rejects a member with an unknown position via the FK on member_positions', async () => {
    const seeded = await seedTenant('constraints-position');
    const pool = getPool();
    await expect(
      pool.query(
        `INSERT INTO members (tenant_id, full_name, position_id) VALUES ($1, 'Bad Position', 99)`,
        [seeded.tenant.id],
      ),
    ).rejects.toThrow();
  });

  it('cascades tenant deletion to every dependent table (Section 14 offboarding/export story)', async () => {
    const seeded = await seedTenant('cascade');
    const siteSettings = new PostgresSiteSettingsRepository();
    await siteSettings.setSocialLinks(seeded.tenant.id, [{ platform: 'twitter', url: 'https://twitter.com/lab' }]);
    await new PostgresMemberRepository().setLinks(seeded.tenant.id, seeded.member.id, [
      { platform: 'github', url: 'https://github.com/lab' },
    ]);

    const pool = getPool();
    await pool.query('DELETE FROM tenants WHERE id = $1', [seeded.tenant.id]);

    const tables = ['users', 'members', 'member_links', 'publications', 'news_items', 'posts', 'site_settings', 'site_social_links'];
    for (const table of tables) {
      const column = table === 'member_links' ? null : 'tenant_id';
      const result = column
        ? await pool.query(`SELECT 1 FROM ${table} WHERE ${column} = $1`, [seeded.tenant.id])
        : await pool.query(
            `SELECT 1 FROM member_links WHERE member_id = $1`,
            [seeded.member.id],
          );
      expect(result.rowCount).toBe(0);
    }
  });
});
