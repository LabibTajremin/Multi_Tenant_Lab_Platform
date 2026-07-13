import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IPublicationRepository } from '@/domain/repositories/IPublicationRepository';
import type { UseCaseContext } from '../../context';
import { makePublication } from '../../../../tests/fixtures/factories';
import { createPublication } from './CreatePublication';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };
const editor = { id: 'editor-1', role: 'editor' as const };

const validInput = { title: 'A New Study', authors: 'A. Researcher', year: 2025 };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: false, ...overrides };
}

describe('createPublication', () => {
  it('happy path: Admin creates a publication, published immediately', async () => {
    const repo = mock<IPublicationRepository>();
    repo.create.mockResolvedValue(makePublication());

    await createPublication(validInput, ctx({ actor: admin }), { repo });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'published', createdBy: admin.id }));
  });

  it('permission-denied: a public (unauthenticated) actor cannot create a publication, and the repo is never touched', async () => {
    const repo = mock<IPublicationRepository>();

    await expect(createPublication(validInput, ctx({ actor: null }), { repo })).rejects.toThrow(PermissionError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('validation failure: rejects input missing a required field before touching the repo', async () => {
    const repo = mock<IPublicationRepository>();

    await expect(createPublication({ title: '', authors: 'x', year: 2025 }, ctx(), { repo })).rejects.toThrow();
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('review-mode branching: Editor submission is pending_review when review mode is on', async () => {
    const repo = mock<IPublicationRepository>();
    repo.create.mockResolvedValue(makePublication());

    await createPublication(validInput, ctx({ actor: editor, reviewEnabled: true }), { repo });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending_review' }));
  });

  it('review-mode branching: Editor submission publishes immediately when review mode is off', async () => {
    const repo = mock<IPublicationRepository>();
    repo.create.mockResolvedValue(makePublication());

    await createPublication(validInput, ctx({ actor: editor, reviewEnabled: false }), { repo });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'published' }));
  });

  it('review-mode branching: Admin submissions always publish immediately, regardless of review mode', async () => {
    const repo = mock<IPublicationRepository>();
    repo.create.mockResolvedValue(makePublication());

    await createPublication(validInput, ctx({ actor: admin, reviewEnabled: true }), { repo });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'published' }));
  });

  it('tenant-scoping: passes ctx.tenantId into the repository call, not anything from the input', async () => {
    const repo = mock<IPublicationRepository>();
    repo.create.mockResolvedValue(makePublication());

    await createPublication(validInput, ctx({ tenantId: 'tenant-xyz' }), { repo });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-xyz' }));
  });
});
