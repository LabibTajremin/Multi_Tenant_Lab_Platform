import { test, expect } from '@playwright/test';

// The CI/local e2e environment always boots against a tenant created by
// scripts/seed-demo-tenant.ts, which hardcodes this lab name.
test('homepage renders the seeded tenant\'s lab name', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Demo Polymer Lab' })).toBeVisible();
});
