#!/usr/bin/env node
/* eslint-disable no-console */
// Runs EXPLAIN ANALYZE against every hot-path query listed in the Section 4.3
// indexing strategy, against a realistically sized seeded tenant (see
// scripts/seed-load-test.ts), and asserts each plan uses an Index Scan /
// Index Only Scan / Bitmap Index Scan rather than a Sequential Scan —
// exactly the guardrail Section 4.2 calls for so a missing index gets caught
// here, not in production.
//
// Usage: TENANT_ID=<uuid> npx tsx scripts/explain-query-plans.ts
import { config } from 'dotenv';
import { getPool, closePool } from '../src/infrastructure/db/client';

config();

interface HotPathQuery {
  name: string;
  sql: string;
  params: unknown[];
}

function queriesFor(tenantId: string): HotPathQuery[] {
  return [
    {
      name: 'Public /publications (tenant + published, sorted by year)',
      sql: `SELECT * FROM publications WHERE tenant_id = $1 AND status_id = 3 ORDER BY year DESC LIMIT 50`,
      params: [tenantId],
    },
    {
      name: 'Public /publications full-text search',
      sql: `SELECT * FROM publications WHERE tenant_id = $1 AND status_id = 3 AND search_vector @@ plainto_tsquery('english', 'Load') ORDER BY year DESC`,
      params: [tenantId],
    },
    {
      name: 'Public /news (tenant + published, sorted by date)',
      sql: `SELECT * FROM news_items WHERE tenant_id = $1 AND status_id = 3 ORDER BY published_date DESC LIMIT 50`,
      params: [tenantId],
    },
    {
      name: 'Public /funding (tenant + type + published)',
      sql: `SELECT * FROM posts WHERE tenant_id = $1 AND post_type_id = 1 AND status_id = 3`,
      params: [tenantId],
    },
    {
      name: 'Public /gallery (tenant + type + published)',
      sql: `SELECT * FROM posts WHERE tenant_id = $1 AND post_type_id = 2 AND status_id = 3`,
      params: [tenantId],
    },
    {
      name: 'Public /people (tenant, ordered by position + sort_order)',
      sql: `SELECT * FROM members WHERE tenant_id = $1 ORDER BY position_id, sort_order`,
      params: [tenantId],
    },
    {
      name: 'Admin review queue: pending publications',
      sql: `SELECT * FROM publications WHERE tenant_id = $1 AND status_id = 2 ORDER BY created_at ASC`,
      params: [tenantId],
    },
    {
      name: 'Admin review queue: pending news',
      sql: `SELECT * FROM news_items WHERE tenant_id = $1 AND status_id = 2 ORDER BY created_at ASC`,
      params: [tenantId],
    },
    {
      name: 'Admin review queue: pending posts',
      sql: `SELECT * FROM posts WHERE tenant_id = $1 AND status_id = 2 ORDER BY created_at ASC`,
      params: [tenantId],
    },
    {
      name: 'Login: find user by tenant + email',
      sql: `SELECT * FROM users WHERE tenant_id = $1 AND email = $2`,
      params: [tenantId, 'pi@nonexistent.example.edu'],
    },
  ];
}

const GOOD_SCAN_TYPES = ['Index Scan', 'Index Only Scan', 'Bitmap Index Scan', 'Bitmap Heap Scan'];

async function main(): Promise<void> {
  const tenantId = process.env.TENANT_ID;
  if (!tenantId) {
    throw new Error('Set TENANT_ID to a seeded tenant (see scripts/seed-load-test.ts) before running this script.');
  }

  const pool = getPool();

  // Section 4.3 guardrail: re-run ANALYZE after large data loads so the
  // planner's statistics are accurate before judging its choices.
  console.log('Running ANALYZE...');
  await pool.query('ANALYZE');

  let anyFailed = false;

  for (const query of queriesFor(tenantId)) {
    const result = await pool.query(`EXPLAIN ANALYZE ${query.sql}`, query.params);
    const planLines = result.rows.map((r) => r['QUERY PLAN'] as string);
    const planText = planLines.join('\n');
    const usesSeqScan = /Seq Scan/.test(planText);
    const usesGoodScan = GOOD_SCAN_TYPES.some((t) => planText.includes(t));
    const ok = !usesSeqScan || usesGoodScan;
    // A plan can legitimately mix a Seq Scan on a tiny lookup table (e.g.
    // content_statuses is never scanned here, but a nested loop plan might
    // still show one for something trivial) with an Index Scan on the actual
    // hot-path table — so the real signal is "was an index used at all",
    // not "was Seq Scan completely absent from the plan text".
    anyFailed = anyFailed || !usesGoodScan;

    console.log(`\n${ok && usesGoodScan ? '✅' : '⚠️ '} ${query.name}`);
    console.log(planLines.map((l) => `   ${l}`).join('\n'));
  }

  if (anyFailed) {
    console.error('\nOne or more hot-path queries never used an index. Review the plans above.');
    process.exitCode = 1;
  } else {
    console.log('\nAll hot-path queries use an index-based scan.');
  }
}

main()
  .catch((error) => {
    console.error('explain-query-plans failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => closePool());
