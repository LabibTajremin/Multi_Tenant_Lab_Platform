#!/usr/bin/env node
/* eslint-disable no-console */
// Seeds a tenant with a realistically large volume of data (thousands of
// rows), for use by scripts/explain-query-plans.ts (Section 16 build order,
// step 15: "Seed a realistically sized dataset ... and run EXPLAIN ANALYZE
// against every hot-path query"). Uses bulk multi-row INSERTs directly
// against the pool rather than looping through the repositories one row at a
// time — at this volume the per-call transaction/round-trip overhead of the
// repository layer would make seeding take minutes instead of seconds.
import { config } from 'dotenv';
import { getPool, closePool } from '../src/infrastructure/db/client';
import { provisionTenant } from '../src/application/use-cases/tenants/ProvisionTenant';
import { PostgresTenantRepository } from '../src/infrastructure/repositories/PostgresTenantRepository';
import { PostgresUserRepository } from '../src/infrastructure/repositories/PostgresUserRepository';
import { PostgresSiteSettingsRepository } from '../src/infrastructure/repositories/PostgresSiteSettingsRepository';

config();

const PUBLICATIONS_COUNT = 5000;
const NEWS_COUNT = 1500;
const POSTS_COUNT = 800;
// A real lab has a few dozen members at most — unlike publications/news/posts,
// scaling this tenant's own row count to "thousands" would be unrealistic.
// The table's real-world size instead comes from many tenants sharing it
// (see the filler-tenant loop below), so this stays small on purpose.
const MEMBERS_COUNT = 35;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

async function main(): Promise<void> {
  const pool = getPool();
  const unique = `loadtest-${Date.now()}`;

  const { tenant, admin } = await provisionTenant(
    {
      labName: 'Load Test Lab',
      slug: unique,
      adminEmail: `pi@${unique}.edu`,
      adminDisplayName: 'Dr. Load Test',
    },
    {
      tenantRepo: new PostgresTenantRepository(),
      userRepo: new PostgresUserRepository(),
      siteSettingsRepo: new PostgresSiteSettingsRepository(),
    },
  );
  await new PostgresSiteSettingsRepository().upsert(tenant.id, { tagline: 'Load test tenant' });

  console.log(`Seeding ${PUBLICATIONS_COUNT} publications...`);
  const pubRows = Array.from({ length: PUBLICATIONS_COUNT }, (_, i) => i);
  for (const batch of chunk(pubRows, 500)) {
    const values: string[] = [];
    const params: unknown[] = [];
    for (const i of batch) {
      const base = params.length;
      // ~10% pending_review, ~5% rejected, rest published — so the partial
      // pending-review index and the published composite index both get
      // realistically sized, not just the happy path.
      const statusId = i % 20 === 0 ? 2 : i % 20 === 1 ? 4 : 3;
      values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`);
      params.push(
        tenant.id,
        `Load Test Publication ${i}`,
        'Author One, Author Two',
        1990 + (i % 36),
        statusId,
        admin.id,
      );
    }
    await pool.query(
      `INSERT INTO publications (tenant_id, title, authors, year, status_id, created_by) VALUES ${values.join(',')}`,
      params,
    );
  }

  console.log(`Seeding ${NEWS_COUNT} news items...`);
  for (const batch of chunk(Array.from({ length: NEWS_COUNT }, (_, i) => i), 500)) {
    const values: string[] = [];
    const params: unknown[] = [];
    for (const i of batch) {
      const base = params.length;
      const statusId = i % 20 === 0 ? 2 : i % 20 === 1 ? 4 : 3;
      values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, CURRENT_DATE - ($${base + 6})::int)`);
      params.push(tenant.id, `Load Test News ${i}`, 'Body text for load testing.', statusId, admin.id, i % 3000);
    }
    await pool.query(
      `INSERT INTO news_items (tenant_id, title, body, status_id, created_by, published_date) VALUES ${values.join(',')}`,
      params,
    );
  }

  console.log(`Seeding ${POSTS_COUNT} posts...`);
  for (const batch of chunk(Array.from({ length: POSTS_COUNT }, (_, i) => i), 500)) {
    const values: string[] = [];
    const params: unknown[] = [];
    for (const i of batch) {
      const base = params.length;
      const statusId = i % 20 === 0 ? 2 : i % 20 === 1 ? 4 : 3;
      const postTypeId = (i % 3) + 1; // funding / gallery / research
      values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
      params.push(tenant.id, postTypeId, `Load Test Post ${i}`, statusId, admin.id);
    }
    await pool.query(
      `INSERT INTO posts (tenant_id, post_type_id, title, status_id, created_by) VALUES ${values.join(',')}`,
      params,
    );
  }

  console.log(`Seeding ${MEMBERS_COUNT} members...`);
  for (const batch of chunk(Array.from({ length: MEMBERS_COUNT }, (_, i) => i), 500)) {
    const values: string[] = [];
    const params: unknown[] = [];
    for (const i of batch) {
      const base = params.length;
      const positionId = (i % 6) + 1;
      values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
      params.push(tenant.id, `Load Test Member ${i}`, positionId, i);
    }
    await pool.query(
      `INSERT INTO members (tenant_id, full_name, position_id, sort_order) VALUES ${values.join(',')}`,
      params,
    );
  }

  // users and members are platform-wide tables shared across every tenant
  // (Section 2/4), so their realistic size comes from MANY tenants each
  // contributing a handful of rows — not from one tenant having thousands of
  // members, which no real lab does. Fill in ~60 filler tenants worth of
  // rows so idx_users_tenant_role and idx_members_tenant_position_sort are
  // filtering a genuinely large table, matching production shape.
  console.log('Seeding filler tenants for realistic users/members table size...');
  const FILLER_TENANTS = 400;
  for (let t = 0; t < FILLER_TENANTS; t++) {
    const fillerResult = await pool.query<{ id: string }>(
      `INSERT INTO tenants (slug, lab_name) VALUES ($1, $2) RETURNING id`,
      [`${unique}-filler-${t}`, `Filler Lab ${t}`],
    );
    const fillerTenantId = fillerResult.rows[0]!.id;

    const userValues: string[] = [];
    const userParams: unknown[] = [];
    for (let u = 0; u < 30; u++) {
      const base = userParams.length;
      const roleId = u === 0 ? 1 : 2;
      userValues.push(`($${base + 1}, $${base + 2}, 'x', $${base + 3}, $${base + 4})`);
      userParams.push(fillerTenantId, `user${u}@filler-${t}.edu`, roleId, `Filler User ${u}`);
    }
    await pool.query(
      `INSERT INTO users (tenant_id, email, password_hash, role_id, display_name) VALUES ${userValues.join(',')}`,
      userParams,
    );

    const memberValues: string[] = [];
    const memberParams: unknown[] = [];
    for (let m = 0; m < 8; m++) {
      const base = memberParams.length;
      memberValues.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
      memberParams.push(fillerTenantId, `Filler Member ${m}`, (m % 6) + 1, m);
    }
    await pool.query(
      `INSERT INTO members (tenant_id, full_name, position_id, sort_order) VALUES ${memberValues.join(',')}`,
      memberParams,
    );
  }

  console.log(`\nSeeded load-test tenant.`);
  console.log(`TENANT_ID=${tenant.id}`);
}

main()
  .catch((error) => {
    console.error('Load-test seeding failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => closePool());
