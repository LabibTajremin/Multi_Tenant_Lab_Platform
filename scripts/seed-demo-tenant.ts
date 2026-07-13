#!/usr/bin/env node
/* eslint-disable no-console */
// Provisions a fully-usable demo tenant: tenant + Admin + completed setup
// (site_settings) + a few pieces of demo content, so a fresh checkout (or CI's
// e2e job) has something real to point the app and Playwright at. Prints
// TENANT_ID=<uuid> as its last stdout line so callers (see .github/workflows/ci.yml)
// can capture it into $GITHUB_ENV / a local .env file.
import { config } from 'dotenv';
import { provisionTenant } from '../src/application/use-cases/tenants/ProvisionTenant';
import { PostgresTenantRepository } from '../src/infrastructure/repositories/PostgresTenantRepository';
import { PostgresUserRepository } from '../src/infrastructure/repositories/PostgresUserRepository';
import { PostgresSiteSettingsRepository } from '../src/infrastructure/repositories/PostgresSiteSettingsRepository';
import { PostgresMemberRepository } from '../src/infrastructure/repositories/PostgresMemberRepository';
import { PostgresPublicationRepository } from '../src/infrastructure/repositories/PostgresPublicationRepository';
import { PostgresNewsRepository } from '../src/infrastructure/repositories/PostgresNewsRepository';
import { PostgresPostRepository } from '../src/infrastructure/repositories/PostgresPostRepository';
import { closePool } from '../src/infrastructure/db/client';

config();

async function main(): Promise<void> {
  const unique = `demo-${Date.now()}`;
  const tenantRepo = new PostgresTenantRepository();
  const userRepo = new PostgresUserRepository();
  const siteSettingsRepo = new PostgresSiteSettingsRepository();

  const { tenant, admin, temporaryPassword } = await provisionTenant(
    {
      labName: 'Demo Polymer Lab',
      slug: unique,
      university: 'Demo State University',
      adminEmail: `pi@${unique}.edu`,
      adminDisplayName: 'Dr. Demo',
      primaryColor: 'ocean',
    },
    { tenantRepo, userRepo, siteSettingsRepo },
  );

  // Completes the /setup wizard programmatically (writes the site_settings row
  // that flips isTenantProvisioned() to true).
  await siteSettingsRepo.upsert(tenant.id, {
    tagline: 'Advancing polymer research, together.',
    contactEmail: `pi@${unique}.edu`,
  });

  const members = new PostgresMemberRepository();
  const publications = new PostgresPublicationRepository();
  const news = new PostgresNewsRepository();
  const posts = new PostgresPostRepository();

  await members.create({
    tenantId: tenant.id,
    fullName: 'Dr. Demo',
    position: 'PI',
    userId: admin.id,
    bio: 'Principal Investigator of the Demo Polymer Lab.',
  });
  await publications.create({
    tenantId: tenant.id,
    title: 'Self-Healing Polymers for Sustainable Materials',
    authors: 'Demo, D., Collaborator, C.',
    venue: 'Journal of Demo Science',
    year: new Date().getFullYear(),
    status: 'published',
    createdBy: admin.id,
  });
  await news.create({
    tenantId: tenant.id,
    title: 'Lab launches new website',
    body: 'We are excited to launch our new lab website.',
    status: 'published',
    createdBy: admin.id,
  });
  await posts.create({
    tenantId: tenant.id,
    postType: 'funding',
    title: 'NSF CAREER Award',
    status: 'published',
    createdBy: admin.id,
  });

  console.log(`Tenant:   ${tenant.labName} (${tenant.slug})`);
  console.log(`Admin:    ${admin.email} / ${temporaryPassword}`);
  console.log(`TENANT_ID=${tenant.id}`);
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => closePool());
