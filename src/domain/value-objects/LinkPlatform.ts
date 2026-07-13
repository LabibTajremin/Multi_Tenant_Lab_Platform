export type LinkPlatform = 'website' | 'linkedin' | 'google_scholar' | 'twitter' | 'github';

// Fixed display order so member/tenant social icons render consistently (Section 9.1).
export const LINK_PLATFORMS: readonly LinkPlatform[] = ['website', 'linkedin', 'google_scholar', 'twitter', 'github'];

export function isLinkPlatform(value: string): value is LinkPlatform {
  return (LINK_PLATFORMS as readonly string[]).includes(value);
}
