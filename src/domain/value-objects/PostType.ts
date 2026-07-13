export type PostType = 'funding' | 'gallery' | 'research';

export const POST_TYPES: readonly PostType[] = ['funding', 'gallery', 'research'];

export function isPostType(value: string): value is PostType {
  return (POST_TYPES as readonly string[]).includes(value);
}
