import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { ITenantRepository } from '@/domain/repositories/ITenantRepository';
import type { UseCaseContext } from '../../context';
import { makeTenant } from '../../../../tests/fixtures/factories';
import { toggleReviewMode } from './ToggleReviewMode';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };
const editor = { id: 'editor-1', role: 'editor' as const };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: false, ...overrides };
}

describe('toggleReviewMode', () => {
  it('happy path: Admin turns review mode on', async () => {
    const repo = mock<ITenantRepository>();
    repo.setReviewEnabled.mockResolvedValue(makeTenant({ reviewEnabled: true }));

    const result = await toggleReviewMode(true, ctx(), { repo });

    expect(repo.setReviewEnabled).toHaveBeenCalledWith('tenant-1', true);
    expect(result.reviewEnabled).toBe(true);
  });

  it('permission-denied: an Editor cannot toggle review mode', async () => {
    const repo = mock<ITenantRepository>();

    await expect(toggleReviewMode(true, ctx({ actor: editor }), { repo })).rejects.toThrow(PermissionError);
    expect(repo.setReviewEnabled).not.toHaveBeenCalled();
  });

  it('permission-denied: public actor cannot toggle review mode', async () => {
    const repo = mock<ITenantRepository>();

    await expect(toggleReviewMode(true, ctx({ actor: null }), { repo })).rejects.toThrow(PermissionError);
  });

  it('tenant-scoping: uses ctx.tenantId', async () => {
    const repo = mock<ITenantRepository>();
    repo.setReviewEnabled.mockResolvedValue(makeTenant());

    await toggleReviewMode(false, ctx({ tenantId: 'tenant-xyz' }), { repo });

    expect(repo.setReviewEnabled).toHaveBeenCalledWith('tenant-xyz', false);
  });
});
