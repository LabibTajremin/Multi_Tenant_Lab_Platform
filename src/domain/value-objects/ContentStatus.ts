export type ContentStatus = 'draft' | 'pending_review' | 'published' | 'rejected';

export const CONTENT_STATUSES: readonly ContentStatus[] = ['draft', 'pending_review', 'published', 'rejected'];

export function isContentStatus(value: string): value is ContentStatus {
  return (CONTENT_STATUSES as readonly string[]).includes(value);
}

/**
 * Section 7: the single global review-mode switch decides what status a fresh
 * Editor submission gets. When review mode is off, Editor content publishes
 * immediately, same as an Admin's. This is the one place that rule lives so
 * every content-creation use case (publications/news/posts) applies it identically.
 */
export function resolveSubmissionStatus(role: 'admin' | 'editor', reviewEnabled: boolean): ContentStatus {
  if (role === 'admin') {
    return 'published';
  }
  return reviewEnabled ? 'pending_review' : 'published';
}

export function isPubliclyVisible(status: ContentStatus): boolean {
  return status === 'published';
}
