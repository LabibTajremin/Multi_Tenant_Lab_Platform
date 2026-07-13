import { describe, expect, it } from 'vitest';
import { isPostType, POST_TYPES } from './PostType';

describe('isPostType', () => {
  it('accepts every known post type', () => {
    for (const type of POST_TYPES) {
      expect(isPostType(type)).toBe(true);
    }
  });

  it('rejects an unknown post type', () => {
    expect(isPostType('blog')).toBe(false);
  });
});
