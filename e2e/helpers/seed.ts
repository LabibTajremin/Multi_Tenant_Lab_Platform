import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface SeedInfo {
  tenantId: string;
  adminEmail: string;
  adminPassword: string;
  distractorMarker: string;
}

/** Reads the output of `npm run seed-demo-tenant` (run before the e2e suite
 * in CI and expected locally too — see README). */
export function readSeedInfo(): SeedInfo {
  const path = resolve(process.cwd(), '.e2e-seed.json');
  let raw: string;
  try {
    raw = readFileSync(path, 'utf-8');
  } catch {
    throw new Error(
      `Could not read ${path}. Run "npm run seed-demo-tenant" against your DATABASE_URL before running the e2e suite.`,
    );
  }
  return JSON.parse(raw) as SeedInfo;
}
