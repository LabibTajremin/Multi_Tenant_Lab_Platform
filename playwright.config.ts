import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// Some sandboxes pre-install a single Chromium binary outside Playwright's own
// managed browser cache (see PLAYWRIGHT_BROWSERS_PATH) instead of the full
// per-project download `playwright install` normally fetches. When that
// binary is present, point launches at it directly rather than downloading —
// CI always has real Playwright-managed browsers, so this is a no-op there.
const SANDBOX_CHROMIUM_PATH = '/opt/pw-browsers/chromium';
const executablePath = !process.env.CI && existsSync(SANDBOX_CHROMIUM_PATH) ? SANDBOX_CHROMIUM_PATH : undefined;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: executablePath ? { executablePath } : undefined } },
  ],
  webServer: process.env.E2E_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'npm run build && npm run start',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
