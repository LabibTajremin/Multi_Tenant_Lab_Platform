import { test, expect } from '@playwright/test';
import { readSeedInfo } from './helpers/seed';
import { loginAs } from './helpers/auth';

test('Admin logs in, creates a publication, and sees it live on the public /publications page', async ({ page }) => {
  const seed = readSeedInfo();
  await loginAs(page, seed.adminEmail, seed.adminPassword);

  const title = `E2E Admin Publication ${Date.now()}`;
  await page.goto('/admin/publications/new');
  await page.fill('#title', title);
  await page.fill('#authors', 'A. E2E Tester');
  await page.fill('#year', '2025');
  await page.click('button[type=submit]:has-text("Add publication")');
  await page.waitForURL(/\/admin\/publications$/, { timeout: 15000 });
  await expect(page.getByText(title)).toBeVisible();

  await page.goto('/publications');
  await expect(page.getByText(title)).toBeVisible();
});
