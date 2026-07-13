import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PostgresPublicationRepository } from '@/infrastructure/repositories/PostgresPublicationRepository';
import { PostgresNewsRepository } from '@/infrastructure/repositories/PostgresNewsRepository';
import { PostgresPostRepository } from '@/infrastructure/repositories/PostgresPostRepository';
import { PostgresMemberRepository } from '@/infrastructure/repositories/PostgresMemberRepository';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { withTenantScope, closePool } from '@/infrastructure/db/client';
import { seedTenant, type SeededTenant } from '../helpers/seedTenants';
import { closeAppRolePool, getAppRolePool } from '../helpers/appRole';

let tenantA: SeededTenant;
let tenantB: SeededTenant;

beforeAll(async () => {
  tenantA = await seedTenant('iso-a');
  tenantB = await seedTenant('iso-b');
});

afterAll(async () => {
  await closeAppRolePool();
});

describe('repository-layer tenant isolation (Section 15.3, layer 1: WHERE tenant_id = $1)', () => {
  it('publications: reading as tenant A never returns tenant B rows', async () => {
    const repo = new PostgresPublicationRepository();
    const asA = await repo.listAll(tenantA.tenant.id);
    expect(asA.map((p) => p.id)).toContain(tenantA.publication.id);
    expect(asA.map((p) => p.id)).not.toContain(tenantB.publication.id);

    const guessed = await repo.findById(tenantA.tenant.id, tenantB.publication.id);
    expect(guessed).toBeNull();
  });

  it('publications: updating as tenant A cannot modify a tenant B row, even with its real id', async () => {
    const repo = new PostgresPublicationRepository();
    await expect(repo.update(tenantA.tenant.id, tenantB.publication.id, { title: 'hijacked' })).rejects.toThrow();

    const stillIntact = await repo.findById(tenantB.tenant.id, tenantB.publication.id);
    expect(stillIntact?.title).toBe(tenantB.publication.title);
  });

  it('publications: deleting as tenant A cannot delete a tenant B row', async () => {
    const repo = new PostgresPublicationRepository();
    await repo.delete(tenantA.tenant.id, tenantB.publication.id);

    const stillThere = await repo.findById(tenantB.tenant.id, tenantB.publication.id);
    expect(stillThere).not.toBeNull();
  });

  it('news_items: cross-tenant read/update/delete are all blocked', async () => {
    const repo = new PostgresNewsRepository();
    expect(await repo.findById(tenantA.tenant.id, tenantB.newsItem.id)).toBeNull();
    await expect(repo.update(tenantA.tenant.id, tenantB.newsItem.id, { title: 'x' })).rejects.toThrow();
    await repo.delete(tenantA.tenant.id, tenantB.newsItem.id);
    expect(await repo.findById(tenantB.tenant.id, tenantB.newsItem.id)).not.toBeNull();
  });

  it('posts: cross-tenant read/update/delete are all blocked', async () => {
    const repo = new PostgresPostRepository();
    expect(await repo.findById(tenantA.tenant.id, tenantB.post.id)).toBeNull();
    await expect(repo.update(tenantA.tenant.id, tenantB.post.id, { title: 'x' })).rejects.toThrow();
    await repo.delete(tenantA.tenant.id, tenantB.post.id);
    expect(await repo.findById(tenantB.tenant.id, tenantB.post.id)).not.toBeNull();
  });

  it('members: cross-tenant read/update/delete are all blocked', async () => {
    const repo = new PostgresMemberRepository();
    expect(await repo.findById(tenantA.tenant.id, tenantB.member.id)).toBeNull();
    await expect(repo.update(tenantA.tenant.id, tenantB.member.id, { fullName: 'x' })).rejects.toThrow();
    await repo.delete(tenantA.tenant.id, tenantB.member.id);
    expect(await repo.findById(tenantB.tenant.id, tenantB.member.id)).not.toBeNull();
  });

  it('users: cross-tenant read is blocked', async () => {
    const repo = new PostgresUserRepository();
    expect(await repo.findById(tenantA.tenant.id, tenantB.admin.id)).toBeNull();
    expect(await repo.findByEmail(tenantA.tenant.id, tenantB.admin.email)).toBeNull();
  });
});

describe('Row-Level Security enforcement (Section 15.3, layer 2 — independent of repository code)', () => {
  it('a query that forgets WHERE tenant_id is still blocked by RLS when connected as the non-superuser app role', async () => {
    const appPool = getAppRolePool();

    // Simulate a repository bug: no tenant_id filter at all, only app.tenant_id set
    // via SET LOCAL / set_config for the transaction, exactly as the real
    // repositories do — but the SQL below deliberately omits "WHERE tenant_id = $1"
    // to prove RLS alone still scopes the result set.
    const rowsForA = await withTenantScope(
      tenantA.tenant.id,
      async (client) => {
        const result = await client.query('SELECT id FROM publications');
        return result.rows as { id: string }[];
      },
      appPool,
    );

    expect(rowsForA.map((r) => r.id)).toContain(tenantA.publication.id);
    expect(rowsForA.map((r) => r.id)).not.toContain(tenantB.publication.id);
  });

  it('an unscoped INSERT for another tenant is rejected by the RLS WITH CHECK clause', async () => {
    const appPool = getAppRolePool();

    await expect(
      withTenantScope(
        tenantA.tenant.id,
        async (client) => {
          await client.query(
            `INSERT INTO publications (tenant_id, title, authors, year, status_id, created_by)
             VALUES ($1, 'sneaky', 'nobody', 2025, 3, $2)`,
            [tenantB.tenant.id, tenantB.admin.id],
          );
        },
        appPool,
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it('reproduces the same isolation with RLS bypassed (superuser connection) — repository filtering alone catches it', async () => {
    // This is the "RLS temporarily disabled" half of the Section 15.3 requirement:
    // the default pool connects as a superuser, which bypasses RLS entirely, yet
    // the repository's own WHERE tenant_id clause still prevents cross-tenant access.
    const repo = new PostgresPublicationRepository();
    const asA = await repo.listAll(tenantA.tenant.id);
    expect(asA.map((p) => p.id)).not.toContain(tenantB.publication.id);
  });
});

afterAll(async () => {
  await closePool();
});
