import { test, expect } from '@playwright/test';
import { readSeedInfo } from './helpers/seed';
import { loginAs } from './helpers/auth';

test('an Editor is blocked from Admin-only screens', async ({ page }) => {
  const seed = readSeedInfo();

  // Admin creates a fresh Editor account.
  await loginAs(page, seed.adminEmail, seed.adminPassword);
  const editorEmail = `e2e-rbac-editor-${Date.now()}@example.edu`;
  await page.goto('/admin/users');
  await page.fill('#displayName', 'RBAC Test Editor');
  await page.fill('#email', editorEmail);
  await page.click('button[type=submit]:has-text("Create Editor account")');
  await page.waitForSelector('code');
  const editorTempPassword = (await page.locator('code').first().textContent())!.trim();

  await loginAs(page, editorEmail, editorTempPassword);

  await page.goto('/admin/settings');
  await expect(page).toHaveURL(/\/admin\/dashboard/);

  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/admin\/dashboard/);

  // The nav itself shouldn't even offer these links to an Editor.
  await page.goto('/admin/dashboard');
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0);
});

test('an unauthenticated visitor is redirected to /login for any admin route', async ({ page, context }) => {
  await context.clearCookies();
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/\/login/);
});
