import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { ISiteSettingsRepository } from '@/domain/repositories/ISiteSettingsRepository';
import type { UseCaseContext } from '../../context';
import { makeSiteSettings } from '../../../../tests/fixtures/factories';
import { updateSiteSettings } from './UpdateSiteSettings';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };
const editor = { id: 'editor-1', role: 'editor' as const };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: false, ...overrides };
}

describe('updateSiteSettings', () => {
  it('happy path: Admin updates tagline and contact email', async () => {
    const repo = mock<ISiteSettingsRepository>();
    repo.upsert.mockResolvedValue(makeSiteSettings());

    await updateSiteSettings({ tagline: 'New tagline' }, ctx(), { repo });

    expect(repo.upsert).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ tagline: 'New tagline' }));
  });

  it('permission-denied: an Editor cannot change site settings', async () => {
    const repo = mock<ISiteSettingsRepository>();

    await expect(updateSiteSettings({ tagline: 'x' }, ctx({ actor: editor }), { repo })).rejects.toThrow(
      PermissionError,
    );
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('validation failure: rejects an invalid contact email', async () => {
    const repo = mock<ISiteSettingsRepository>();

    await expect(updateSiteSettings({ contactEmail: 'not-an-email' }, ctx(), { repo })).rejects.toThrow();
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('sets social links when provided', async () => {
    const repo = mock<ISiteSettingsRepository>();
    repo.upsert.mockResolvedValue(makeSiteSettings());

    await updateSiteSettings({ socialLinks: [{ platform: 'twitter', url: 'https://twitter.com/lab' }] }, ctx(), {
      repo,
    });

    expect(repo.setSocialLinks).toHaveBeenCalledWith('tenant-1', [{ platform: 'twitter', url: 'https://twitter.com/lab' }]);
  });

  it('tenant-scoping: uses ctx.tenantId', async () => {
    const repo = mock<ISiteSettingsRepository>();
    repo.upsert.mockResolvedValue(makeSiteSettings());

    await updateSiteSettings({ tagline: 'x' }, ctx({ tenantId: 'tenant-xyz' }), { repo });

    expect(repo.upsert).toHaveBeenCalledWith('tenant-xyz', expect.anything());
  });
});
