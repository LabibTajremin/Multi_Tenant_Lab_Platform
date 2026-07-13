import type { Page } from '@playwright/test';

/** Logs in via the real credentials form. If the account still has
 * must_reset_password set (true for any freshly created Editor, per Section
 * 5), completes that flow too and signs back in with the new password. */
export async function loginAs(page: Page, email: string, password: string, newPasswordIfForced = 'newTestPassword123'): Promise<string> {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type=submit]');
  await page.waitForURL(/\/(admin\/dashboard|reset-password)/, { timeout: 15000 });

  if (page.url().includes('reset-password')) {
    await page.fill('#newPassword', newPasswordIfForced);
    await page.fill('#confirm', newPasswordIfForced);
    await page.click('button[type=submit]');
    await page.waitForURL(/\/login/, { timeout: 15000 });
    await page.fill('#email', email);
    await page.fill('#password', newPasswordIfForced);
    await page.click('button[type=submit]');
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });
    return newPasswordIfForced;
  }

  return password;
}
