import { test, expect } from '@playwright/test';
import { readSeedInfo } from './helpers/seed';
import { loginAs } from './helpers/auth';

// scripts/seed-demo-tenant.ts also provisions a second, wholly separate
// tenant in the same shared database, with a distinctive marker string as
// both its tagline and a publication title. This deployment's TENANT_ID is
// the FIRST tenant only — the marker must never surface anywhere in this
// deployment's UI, public or admin, no matter how it's queried.
test('the other tenant\'s content never renders anywhere in this deployment\'s UI', async ({ page }) => {
  const seed = readSeedInfo();

  await page.goto('/');
  await expect(page.getByText(seed.distractorMarker)).toHaveCount(0);

  await page.goto('/publications');
  await expect(page.getByText(seed.distractorMarker)).toHaveCount(0);

  await page.goto(`/publications?q=${encodeURIComponent(seed.distractorMarker)}`);
  await expect(page.getByText(seed.distractorMarker)).toHaveCount(0);
  await expect(page.getByText('No publications match.')).toBeVisible();

  await loginAs(page, seed.adminEmail, seed.adminPassword);
  await page.goto('/admin/publications');
  await expect(page.getByText(seed.distractorMarker)).toHaveCount(0);
});
