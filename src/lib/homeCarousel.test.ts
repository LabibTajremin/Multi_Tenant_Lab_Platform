import { describe, expect, it } from 'vitest';
import { buildCarouselItems } from './homeCarousel';

interface Item {
  id: string;
}

describe('buildCarouselItems', () => {
  it('returns featured items alone when there are already enough of them', () => {
    const featured: Item[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const published: Item[] = [{ id: 'x' }, { id: 'y' }];

    expect(buildCarouselItems(featured, published, 2)).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('tops up with published items when there are not enough featured ones', () => {
    const featured: Item[] = [{ id: 'a' }];
    const published: Item[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

    expect(buildCarouselItems(featured, published, 3)).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
  });

  it('does not duplicate an item that appears in both lists', () => {
    const featured: Item[] = [{ id: 'a' }];
    const published: Item[] = [{ id: 'a' }, { id: 'b' }];

    expect(buildCarouselItems(featured, published, 5)).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('returns everything available when there are fewer items than the requested size', () => {
    const featured: Item[] = [];
    const published: Item[] = [{ id: 'a' }];

    expect(buildCarouselItems(featured, published, 8)).toEqual([{ id: 'a' }]);
  });

  it('returns an empty array when there is nothing to show', () => {
    expect(buildCarouselItems([], [], 8)).toEqual([]);
  });
});
