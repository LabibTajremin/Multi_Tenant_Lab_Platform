import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IPostRepository } from '@/domain/repositories/IPostRepository';
import type { UseCaseContext } from '../../context';
import { makePost } from '../../../../tests/fixtures/factories';
import { createPost } from './CreatePost';
import { PermissionError } from '../../errors';

const admin = { id: 'admin-1', role: 'admin' as const };
const editor = { id: 'editor-1', role: 'editor' as const };
const validInput = { postType: 'funding', title: 'NSF Grant #999' };

function ctx(overrides: Partial<UseCaseContext> = {}): UseCaseContext {
  return { actor: admin, tenantId: 'tenant-1', reviewEnabled: false, ...overrides };
}

describe('createPost', () => {
  it('happy path: Admin creates a post, published immediately', async () => {
    const repo = mock<IPostRepository>();
    repo.create.mockResolvedValue(makePost());

    await createPost(validInput, ctx(), { repo });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'published', postType: 'funding' }));
  });

  it('permission-denied: public actor cannot create a post', async () => {
    const repo = mock<IPostRepository>();

    await expect(createPost(validInput, ctx({ actor: null }), { repo })).rejects.toThrow(PermissionError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('validation failure: rejects an unknown postType', async () => {
    const repo = mock<IPostRepository>();

    await expect(createPost({ postType: 'blog', title: 'x' }, ctx(), { repo })).rejects.toThrow();
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('review-mode branching: Editor submission is pending_review when review mode is on', async () => {
    const repo = mock<IPostRepository>();
    repo.create.mockResolvedValue(makePost());

    await createPost(validInput, ctx({ actor: editor, reviewEnabled: true }), { repo });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending_review' }));
  });

  it('tenant-scoping: uses ctx.tenantId', async () => {
    const repo = mock<IPostRepository>();
    repo.create.mockResolvedValue(makePost());

    await createPost(validInput, ctx({ tenantId: 'tenant-xyz' }), { repo });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-xyz' }));
  });
});
