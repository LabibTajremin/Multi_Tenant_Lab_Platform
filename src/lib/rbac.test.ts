import { describe, expect, it } from 'vitest';
import {
  canApproveContent,
  canChangeSiteSettings,
  canCreateContent,
  canDeleteContent,
  canEditContent,
  canEditMemberProfile,
  canFeatureContent,
  canManageMembers,
  canManageUsers,
  canToggleReviewMode,
  EDITOR_CAN_DELETE_OWN_PUBLISHED_CONTENT,
  type AuthUser,
} from './rbac';
import type { ContentStatus } from '@/domain/value-objects/ContentStatus';

const admin: AuthUser = { id: 'admin-1', role: 'admin' };
const editor: AuthUser = { id: 'editor-1', role: 'editor' };
const otherEditor: AuthUser = { id: 'editor-2', role: 'editor' };
const publicVisitor = null;

const STATUSES: ContentStatus[] = ['draft', 'pending_review', 'published', 'rejected'];

describe('admin-only capabilities', () => {
  const adminOnlyFns = [
    canManageUsers,
    canToggleReviewMode,
    canChangeSiteSettings,
    canApproveContent,
    canManageMembers,
    canFeatureContent,
  ];

  it.each(adminOnlyFns)('%p is true for admin, false for editor, false for public', (fn) => {
    expect(fn(admin)).toBe(true);
    expect(fn(editor)).toBe(false);
    expect(fn(publicVisitor)).toBe(false);
  });
});

describe('canCreateContent', () => {
  it('allows admin and editor, denies public', () => {
    expect(canCreateContent(admin)).toBe(true);
    expect(canCreateContent(editor)).toBe(true);
    expect(canCreateContent(publicVisitor)).toBe(false);
  });
});

describe('canEditContent — {public, editor, admin} x {own, others} x {draft, pending, published, rejected}', () => {
  for (const status of STATUSES) {
    it(`admin can always edit content in status=${status} regardless of owner`, () => {
      expect(canEditContent(admin, { createdBy: editor.id, status })).toBe(true);
      expect(canEditContent(admin, { createdBy: admin.id, status })).toBe(true);
    });

    it(`editor can edit their own content in status=${status}`, () => {
      expect(canEditContent(editor, { createdBy: editor.id, status })).toBe(true);
    });

    it(`editor cannot edit another editor's content in status=${status}`, () => {
      expect(canEditContent(editor, { createdBy: otherEditor.id, status })).toBe(false);
    });

    it(`public cannot edit content in status=${status}`, () => {
      expect(canEditContent(publicVisitor, { createdBy: editor.id, status })).toBe(false);
    });
  }
});

describe('canDeleteContent — {public, editor, admin} x {own, others} x {draft, pending, published, rejected}', () => {
  for (const status of STATUSES) {
    it(`admin can always delete content in status=${status} regardless of owner`, () => {
      expect(canDeleteContent(admin, { createdBy: editor.id, status })).toBe(true);
    });

    it(`editor cannot delete another editor's content in status=${status}`, () => {
      expect(canDeleteContent(editor, { createdBy: otherEditor.id, status })).toBe(false);
    });

    it(`public cannot delete content in status=${status}`, () => {
      expect(canDeleteContent(publicVisitor, { createdBy: editor.id, status })).toBe(false);
    });
  }

  it('editor can delete their own draft/pending_review/rejected content', () => {
    expect(canDeleteContent(editor, { createdBy: editor.id, status: 'draft' })).toBe(true);
    expect(canDeleteContent(editor, { createdBy: editor.id, status: 'pending_review' })).toBe(true);
    expect(canDeleteContent(editor, { createdBy: editor.id, status: 'rejected' })).toBe(true);
  });

  it('editor deleting their own published content follows the configurable flag', () => {
    expect(canDeleteContent(editor, { createdBy: editor.id, status: 'published' })).toBe(
      EDITOR_CAN_DELETE_OWN_PUBLISHED_CONTENT,
    );
  });
});

describe('canEditMemberProfile', () => {
  it('admin can edit any member profile, including one with no linked login', () => {
    expect(canEditMemberProfile(admin, { userId: null })).toBe(true);
    expect(canEditMemberProfile(admin, { userId: editor.id })).toBe(true);
  });

  it('editor can edit only their own linked member profile', () => {
    expect(canEditMemberProfile(editor, { userId: editor.id })).toBe(true);
    expect(canEditMemberProfile(editor, { userId: otherEditor.id })).toBe(false);
  });

  it('editor cannot edit a login-less (alumni) profile', () => {
    expect(canEditMemberProfile(editor, { userId: null })).toBe(false);
  });

  it('public cannot edit any member profile', () => {
    expect(canEditMemberProfile(publicVisitor, { userId: null })).toBe(false);
  });
});
