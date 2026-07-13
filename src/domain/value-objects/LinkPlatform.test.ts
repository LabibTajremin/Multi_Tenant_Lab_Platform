import { describe, expect, it } from 'vitest';
import { isLinkPlatform, LINK_PLATFORMS } from './LinkPlatform';

describe('isLinkPlatform', () => {
  it('accepts every known platform', () => {
    for (const platform of LINK_PLATFORMS) {
      expect(isLinkPlatform(platform)).toBe(true);
    }
  });

  it('rejects an unknown platform', () => {
    expect(isLinkPlatform('mastodon')).toBe(false);
  });
});
