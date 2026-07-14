import type { Role } from '@/domain/value-objects/Role';
import type { ContentStatus } from '@/domain/value-objects/ContentStatus';

export interface AuthUser {
  id: string;
  role: Role;
}

export interface OwnedContent {
  createdBy: string;
  status: ContentStatus;
}

export interface MemberProfile {
  userId: string | null;
}

/**
 * Section 6, Editor content ownership (the "resolve per Section 16 Q9" default):
 * an Editor may edit or delete their own not-yet-published content freely. Once
 * content is published, an Editor may still edit it (a new pending_review
 * revision if review mode is on) but may NOT delete it — only an Admin can
 * delete published content. Flip this to `true` if that decision changes; every
 * call site in this file already reads from here rather than hardcoding the rule.
 */
export const EDITOR_CAN_DELETE_OWN_PUBLISHED_CONTENT = false;

function isNonNull(user: AuthUser | null): user is AuthUser {
  return user !== null;
}

/** Public visitors and logged-out sessions can never write — every function below
 * accepts `AuthUser | null` and every server action/route handler must call these,
 * not just hide a button, since that's the only real enforcement boundary. */

export function canManageUsers(user: AuthUser | null): boolean {
  return isNonNull(user) && user.role === 'admin';
}

export function canToggleReviewMode(user: AuthUser | null): boolean {
  return isNonNull(user) && user.role === 'admin';
}

export function canChangeSiteSettings(user: AuthUser | null): boolean {
  return isNonNull(user) && user.role === 'admin';
}

export function canApproveContent(user: AuthUser | null): boolean {
  return isNonNull(user) && user.role === 'admin';
}

/** Curating what shows in the home page carousels is an Admin decision. */
export function canFeatureContent(user: AuthUser | null): boolean {
  return isNonNull(user) && user.role === 'admin';
}

/** Both Admin and Editor can add publications/news/posts (subject to review mode). */
export function canCreateContent(user: AuthUser | null): boolean {
  return isNonNull(user) && (user.role === 'admin' || user.role === 'editor');
}

export function canEditContent(user: AuthUser | null, content: OwnedContent): boolean {
  if (!isNonNull(user)) {
    return false;
  }
  if (user.role === 'admin') {
    return true;
  }
  return content.createdBy === user.id;
}

export function canDeleteContent(user: AuthUser | null, content: OwnedContent): boolean {
  if (!isNonNull(user)) {
    return false;
  }
  if (user.role === 'admin') {
    return true;
  }
  const isOwner = content.createdBy === user.id;
  if (!isOwner) {
    return false;
  }
  if (content.status === 'published') {
    return EDITOR_CAN_DELETE_OWN_PUBLISHED_CONTENT;
  }
  return true;
}

/** Section 6: member profile CRUD is Admin-only, except a member may edit their own profile. */
export function canManageMembers(user: AuthUser | null): boolean {
  return isNonNull(user) && user.role === 'admin';
}

export function canEditMemberProfile(user: AuthUser | null, member: MemberProfile): boolean {
  if (!isNonNull(user)) {
    return false;
  }
  if (user.role === 'admin') {
    return true;
  }
  return member.userId !== null && member.userId === user.id;
}
