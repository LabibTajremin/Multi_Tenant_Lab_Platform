#!/usr/bin/env node
/* eslint-disable no-console */
// Exports one tenant's complete data — every row across every tenant-scoped
// table, plus every object under its storage prefix — into a single portable
// archive. This is what "a lab leaving the platform" needs (Section 14 /
// Section 4.1 of the requirements doc): the tenant_id foreign keys with
// ON DELETE CASCADE make the row set easy to identify; the tenant-prefixed
// storage keys (Section 11) make the file set easy to identify too.
//
// Usage: npx tsx scripts/export-tenant.ts --tenant-id=<uuid>
//    or: npx tsx scripts/export-tenant.ts --slug=<slug>
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { config } from 'dotenv';
import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { getPool, closePool } from '../src/infrastructure/db/client';
import { getEnv } from '../src/lib/env';

config();

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (const arg of argv) {
    const match = /^--([a-z-]+)=(.*)$/.exec(arg);
    const key = match?.[1];
    const value = match?.[2];
    if (key !== undefined && value !== undefined) {
      args[key] = value;
    }
  }
  return args;
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const pool = getPool();

  let tenantId = args['tenant-id'];
  if (!tenantId) {
    if (!args.slug) {
      throw new Error('Pass --tenant-id=<uuid> or --slug=<slug>.');
    }
    const result = await pool.query<{ id: string }>('SELECT id FROM tenants WHERE slug = $1', [args.slug]);
    if (result.rows.length === 0) {
      throw new Error(`No tenant found with slug "${args.slug}".`);
    }
    tenantId = result.rows[0]!.id;
  }

  const tenantResult = await pool.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
  if (tenantResult.rows.length === 0) {
    throw new Error(`No tenant found with id "${tenantId}".`);
  }
  const tenant = tenantResult.rows[0];

  console.log(`Exporting tenant "${tenant.slug}" (${tenantId})...`);

  const [users, members, publications, newsItems, posts, siteSettings, siteSocialLinks] = await Promise.all([
    pool.query('SELECT * FROM users WHERE tenant_id = $1', [tenantId]),
    pool.query('SELECT * FROM members WHERE tenant_id = $1', [tenantId]),
    pool.query('SELECT * FROM publications WHERE tenant_id = $1', [tenantId]),
    pool.query('SELECT * FROM news_items WHERE tenant_id = $1', [tenantId]),
    pool.query('SELECT * FROM posts WHERE tenant_id = $1', [tenantId]),
    pool.query('SELECT * FROM site_settings WHERE tenant_id = $1', [tenantId]),
    pool.query('SELECT * FROM site_social_links WHERE tenant_id = $1', [tenantId]),
  ]);

  const memberIds = members.rows.map((m) => m.id);
  const memberLinks = memberIds.length
    ? await pool.query('SELECT * FROM member_links WHERE member_id = ANY($1::uuid[])', [memberIds])
    : { rows: [] };

  const data = {
    exportedAt: new Date().toISOString(),
    tenant: tenant,
    users: users.rows,
    members: members.rows,
    memberLinks: memberLinks.rows,
    publications: publications.rows,
    newsItems: newsItems.rows,
    posts: posts.rows,
    siteSettings: siteSettings.rows,
    siteSocialLinks: siteSocialLinks.rows,
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportDirName = `${tenant.slug}-export-${timestamp}`;
  const exportRoot = join(process.cwd(), 'exports');
  const exportDir = join(exportRoot, exportDirName);
  mkdirSync(join(exportDir, 'files'), { recursive: true });

  writeFileSync(join(exportDir, 'data.json'), JSON.stringify(data, null, 2));
  console.log(
    `Wrote ${users.rows.length} users, ${members.rows.length} members, ${publications.rows.length} publications, ` +
      `${newsItems.rows.length} news items, ${posts.rows.length} posts.`,
  );

  // Download every object under this tenant's storage prefix (Section 11:
  // <tenant_id>/<category>/<uuid>-<filename>).
  const env = getEnv();
  const s3 = new S3Client({
    endpoint: env.STORAGE_ENDPOINT,
    region: env.STORAGE_REGION,
    forcePathStyle: env.STORAGE_FORCE_PATH_STYLE,
    credentials: { accessKeyId: env.STORAGE_ACCESS_KEY_ID, secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY },
  });

  let continuationToken: string | undefined;
  let fileCount = 0;
  do {
    const listing = await s3.send(
      new ListObjectsV2Command({
        Bucket: env.STORAGE_BUCKET,
        Prefix: `${tenantId}/`,
        ContinuationToken: continuationToken,
      }),
    );
    for (const object of listing.Contents ?? []) {
      if (!object.Key) continue;
      const getResult = await s3.send(new GetObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: object.Key }));
      const body = await streamToBuffer(getResult.Body as NodeJS.ReadableStream);
      const destPath = join(exportDir, 'files', object.Key);
      mkdirSync(dirname(destPath), { recursive: true });
      writeFileSync(destPath, body);
      fileCount += 1;
    }
    continuationToken = listing.IsTruncated ? listing.NextContinuationToken : undefined;
  } while (continuationToken);
  console.log(`Downloaded ${fileCount} storage object(s).`);

  const archivePath = `${exportDir}.tar.gz`;
  execFileSync('tar', ['-czf', archivePath, '-C', exportRoot, exportDirName]);
  rmSync(exportDir, { recursive: true, force: true });

  console.log(`\nExport complete: ${archivePath}`);
}

main()
  .catch((error) => {
    console.error('Export failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => closePool());
