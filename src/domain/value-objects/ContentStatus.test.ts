import { describe, expect, it } from 'vitest';
import { isContentStatus, isPubliclyVisible, resolveSubmissionStatus } from './ContentStatus';

describe('resolveSubmissionStatus', () => {
  it('publishes Admin content immediately regardless of review mode', () => {
    expect(resolveSubmissionStatus('admin', true)).toBe('published');
    expect(resolveSubmissionStatus('admin', false)).toBe('published');
  });

  it('sends Editor content to pending_review when review mode is on', () => {
    expect(resolveSubmissionStatus('editor', true)).toBe('pending_review');
  });

  it('publishes Editor content immediately when review mode is off', () => {
    expect(resolveSubmissionStatus('editor', false)).toBe('published');
  });
});

describe('isPubliclyVisible', () => {
  it('is true only for published', () => {
    expect(isPubliclyVisible('published')).toBe(true);
    expect(isPubliclyVisible('draft')).toBe(false);
    expect(isPubliclyVisible('pending_review')).toBe(false);
    expect(isPubliclyVisible('rejected')).toBe(false);
  });
});

describe('isContentStatus', () => {
  it('accepts every known status', () => {
    for (const status of ['draft', 'pending_review', 'published', 'rejected']) {
      expect(isContentStatus(status)).toBe(true);
    }
  });

  it('rejects an unknown status', () => {
    expect(isContentStatus('archived')).toBe(false);
  });
});
