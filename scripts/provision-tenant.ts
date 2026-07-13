#!/usr/bin/env node
/* eslint-disable no-console */
import { createInterface } from 'node:readline/promises';
import { config } from 'dotenv';
import { provisionTenant } from '../src/application/use-cases/tenants/ProvisionTenant';
import { PostgresTenantRepository } from '../src/infrastructure/repositories/PostgresTenantRepository';
import { PostgresUserRepository } from '../src/infrastructure/repositories/PostgresUserRepository';
import { PostgresSiteSettingsRepository } from '../src/infrastructure/repositories/PostgresSiteSettingsRepository';
import { closePool } from '../src/infrastructure/db/client';

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

async function promptFor(
  rl: ReturnType<typeof createInterface>,
  args: Record<string, string>,
  key: string,
  question: string,
  required: boolean,
): Promise<string> {
  if (args[key]) {
    return args[key];
  }
  const answer = await rl.question(question);
  if (!answer && required) {
    throw new Error(`${key} is required.`);
  }
  return answer;
}

function slugify(labName: string): string {
  return labName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    const labName = await promptFor(rl, args, 'lab-name', 'Lab name: ', true);
    const suggestedSlug = slugify(labName);
    const slug =
      args.slug || (await rl.question(`URL slug [${suggestedSlug}]: `)) || suggestedSlug;
    const university = await promptFor(rl, args, 'university', 'University (optional): ', false);
    const adminEmail = await promptFor(rl, args, 'admin-email', 'First Admin email: ', true);
    const adminName = await promptFor(rl, args, 'admin-name', 'First Admin display name: ', true);

    const tenantRepo = new PostgresTenantRepository();
    const userRepo = new PostgresUserRepository();
    const siteSettingsRepo = new PostgresSiteSettingsRepository();

    const result = await provisionTenant(
      {
        labName,
        slug,
        university: university || null,
        adminEmail,
        adminDisplayName: adminName,
      },
      { tenantRepo, userRepo, siteSettingsRepo },
    );

    console.log('\nTenant provisioned successfully.\n');
    console.log(`  Tenant:        ${result.tenant.labName} (${result.tenant.slug})`);
    console.log(`  Tenant ID:     ${result.tenant.id}`);
    console.log(`  Admin email:   ${result.admin.email}`);
    console.log(`  Temporary password (shown once — it is not stored anywhere in plaintext):`);
    console.log(`    ${result.temporaryPassword}`);
    console.log('\nThe Admin must reset this password on first login.\n');
    console.log('Paste the following into this deployment\'s .env file:\n');
    console.log('----------------------------------------------------------------');
    console.log(`TENANT_ID=${result.tenant.id}`);
    console.log(`DATABASE_URL=${process.env.DATABASE_URL ?? '<shared-database-url>'}`);
    console.log('NEXTAUTH_SECRET=<generate-a-random-secret>');
    console.log('NEXTAUTH_URL=<this-deployment-public-url>');
    console.log('STORAGE_ENDPOINT=<s3-compatible-endpoint>');
    console.log('STORAGE_REGION=<region>');
    console.log('STORAGE_BUCKET=<bucket-name>');
    console.log('STORAGE_ACCESS_KEY_ID=<access-key>');
    console.log('STORAGE_SECRET_ACCESS_KEY=<secret-key>');
    console.log('STORAGE_FORCE_PATH_STYLE=true');
    console.log('STORAGE_PUBLIC_BASE_URL=<public-base-url-for-uploaded-files>');
    console.log('----------------------------------------------------------------\n');
  } finally {
    rl.close();
    await closePool();
  }
}

main().catch((error) => {
  console.error('Provisioning failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
