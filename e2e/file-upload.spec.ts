import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { test, expect } from '@playwright/test';
import { readSeedInfo } from './helpers/seed';
import { loginAs } from './helpers/auth';

// A minimal 1x1 PNG and a tiny valid PDF, generated once per run rather than
// checked into the repo.
function writeFixture(path: string, base64: string) {
  writeFileSync(path, Buffer.from(base64, 'base64'));
}

const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const TINY_PDF_BASE64 =
  'JVBERi0xLjEKJcKlwrHDqwoKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nCiAgICAgL1BhZ2VzIDIgMCBSCiAgPj4KZW5kb2JqCgoyIDAgb2JqCiAgPDwgL1R5cGUgL1BhZ2VzCiAgICAgL0tpZHMgWzMgMCBSXQogICAgIC9Db3VudCAxCiAgICAgL01lZGlhQm94IFswIDAgMzAwIDE0NF0KICA+PgplbmRvYmoKCjMgMCBvYmoKICA8PCAgL1R5cGUgL1BhZ2UKICAgICAgL1BhcmVudCAyIDAgUgogICAgICAvUmVzb3VyY2VzCiAgICAgICA8PCAvRm9udCA8PCAvRjEgNCAwIFIgPj4gPj4KICAgICAgL0NvbnRlbnRzIDUgMCBSCiAgPj4KZW5kb2JqCgo0IDAgb2JqCiAgPDwgL1R5cGUgL0ZvbnQKICAgICAvU3VidHlwZSAvVHlwZTEKICAgICAvQmFzZUZvbnQgL1RpbWVzLVJvbWFuCiAgPj4KZW5kb2JqCgo1IDAgb2JqICAlIHBhZ2UgY29udGVudAogIDw8IC9MZW5ndGggNDQgPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNzkgMDAwMDAgbiAKMDAwMDAwMDE3MyAwMDAwMCBuIAowMDAwMDAwMzAxIDAwMDAwIG4gCjAwMDAwMDAzODAgMDAwMDAgbiAKdHJhaWxlcgogIDw8ICAvUm9vdCAxIDAgUgogICAgICAvU2l6ZSA2CiAgPj4Kc3RhcnR4cmVmCjQ5MgolJUVPRg==';

test('Admin uploads a member photo and a publication PDF, and both render correctly', async ({ page }) => {
  const seed = readSeedInfo();
  await loginAs(page, seed.adminEmail, seed.adminPassword);

  const pngPath = join(tmpdir(), `e2e-tiny-${Date.now()}.png`);
  const pdfPath = join(tmpdir(), `e2e-tiny-${Date.now()}.pdf`);
  writeFixture(pngPath, TINY_PNG_BASE64);
  writeFixture(pdfPath, TINY_PDF_BASE64);

  // Member photo upload.
  const memberName = `E2E Photo Member ${Date.now()}`;
  await page.goto('/admin/members/new');
  await page.fill('#fullName', memberName);
  await page.setInputFiles('input[type=file]', pngPath);
  await expect(page.locator('img[alt=""]').first()).toBeVisible({ timeout: 15000 });
  await page.fill('#photoAlt', 'A test member photo');
  await page.click('button[type=submit]:has-text("Add member")');
  await page.waitForURL(/\/admin\/members$/, { timeout: 15000 });

  await page.goto('/people');
  const memberPhoto = page.locator(`img[alt="A test member photo"]`);
  await expect(memberPhoto).toBeVisible();
  const photoSrc = await memberPhoto.getAttribute('src');
  expect(photoSrc).toContain(`/${seed.tenantId}/photo/`);

  // Publication PDF upload.
  const pubTitle = `E2E PDF Publication ${Date.now()}`;
  await page.goto('/admin/publications/new');
  await page.fill('#title', pubTitle);
  await page.fill('#authors', 'A. Uploader');
  await page.fill('#year', '2025');
  const fileInputs = page.locator('input[type=file]');
  await fileInputs.last().setInputFiles(pdfPath);
  await page.waitForTimeout(2000);
  await page.click('button[type=submit]:has-text("Add publication")');
  await page.waitForURL(/\/admin\/publications$/, { timeout: 15000 });

  await page.goto('/publications');
  const pdfLink = page.getByRole('link', { name: 'PDF' }).first();
  await expect(pdfLink).toBeVisible();
  const pdfHref = await pdfLink.getAttribute('href');
  expect(pdfHref).toContain(`/${seed.tenantId}/pdf/`);
});
