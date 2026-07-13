import { test, expect } from '@playwright/test';
import { readSeedInfo } from './helpers/seed';
import { loginAs } from './helpers/auth';

test('Editor submission under review mode is hidden until Admin approves it', async ({ page }) => {
  const seed = readSeedInfo();

  // Admin: ensure review mode is on, then create a fresh Editor account.
  await loginAs(page, seed.adminEmail, seed.adminPassword);
  await page.goto('/admin/settings');
  const toggle = page.locator('input[type=checkbox]');
  if (!(await toggle.isChecked())) {
    await toggle.click();
    await page.waitForTimeout(500);
  }

  const editorEmail = `e2e-editor-${Date.now()}@example.edu`;
  await page.goto('/admin/users');
  await page.fill('#displayName', 'E2E Editor');
  await page.fill('#email', editorEmail);
  await page.click('button[type=submit]:has-text("Create Editor account")');
  await page.waitForSelector('code');
  const editorTempPassword = (await page.locator('code').first().textContent())!.trim();

  // Editor: forced password reset, then submit a news item.
  await loginAs(page, editorEmail, editorTempPassword);

  const title = `E2E Pending News ${Date.now()}`;
  await page.goto('/admin/news/new');
  await page.fill('#title', title);
  await page.fill('#publishedDate', new Date().toISOString().slice(0, 10));
  await page.fill('#body', 'This should be pending review until an Admin approves it.');
  await page.click('button[type=submit]:has-text("Add news item")');
  await page.waitForURL(/\/admin\/news$/, { timeout: 15000 });
  await expect(page.getByText('Pending review')).toBeVisible();

  // Not yet visible on the public site.
  await page.goto('/news');
  await expect(page.getByText(title)).not.toBeVisible();

  // Admin approves it from the review queue.
  await loginAs(page, seed.adminEmail, seed.adminPassword);
  await page.goto('/admin/review-queue');
  await expect(page.getByText(title)).toBeVisible();
  await page.click('button:has-text("Approve")');
  await page.waitForTimeout(500);

  // Now visible on the public site.
  await page.goto('/news');
  await expect(page.getByText(title)).toBeVisible();
});
