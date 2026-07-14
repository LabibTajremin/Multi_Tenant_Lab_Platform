/** Builds a home page carousel's item list: Admin-featured items first, topped
 * up with the latest published items (already ordered by the caller) until
 * `size` is reached, without duplicating an item that's in both lists. */
export function buildCarouselItems<T extends { id: string }>(featured: T[], published: T[], size: number): T[] {
  if (featured.length >= size) {
    return featured.slice(0, size);
  }

  const items = [...featured];
  const seen = new Set(items.map((item) => item.id));

  for (const item of published) {
    if (items.length >= size) {
      break;
    }
    if (!seen.has(item.id)) {
      items.push(item);
      seen.add(item.id);
    }
  }

  return items;
}
