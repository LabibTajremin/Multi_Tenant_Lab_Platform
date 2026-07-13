import type { Role } from '@/domain/value-objects/Role';
import type { ContentStatus } from '@/domain/value-objects/ContentStatus';
import type { MemberPosition } from '@/domain/value-objects/MemberPosition';
import type { PostType } from '@/domain/value-objects/PostType';
import type { LinkPlatform } from '@/domain/value-objects/LinkPlatform';

// Mirrors the seed data inserted by migrations/1735689600000_lookup-tables.js.
// Hardcoded rather than queried per-call: these lookup tables are seeded once at
// migration time and never change without a migration, so a round-trip query for
// every repository call would be pure overhead. If a migration ever renumbers a
// lookup row, update the corresponding map here in the same PR.

const ROLE_TO_ID: Record<Role, number> = { admin: 1, editor: 2 };
const ID_TO_ROLE: Record<number, Role> = { 1: 'admin', 2: 'editor' };

const STATUS_TO_ID: Record<ContentStatus, number> = {
  draft: 1,
  pending_review: 2,
  published: 3,
  rejected: 4,
};
const ID_TO_STATUS: Record<number, ContentStatus> = {
  1: 'draft',
  2: 'pending_review',
  3: 'published',
  4: 'rejected',
};

const POSITION_TO_ID: Record<MemberPosition, number> = {
  PI: 1,
  Postdoc: 2,
  PhD: 3,
  MS: 4,
  Undergrad: 5,
  Alumnus: 6,
};
const ID_TO_POSITION: Record<number, MemberPosition> = {
  1: 'PI',
  2: 'Postdoc',
  3: 'PhD',
  4: 'MS',
  5: 'Undergrad',
  6: 'Alumnus',
};

const POST_TYPE_TO_ID: Record<PostType, number> = { funding: 1, gallery: 2, research: 3 };
const ID_TO_POST_TYPE: Record<number, PostType> = { 1: 'funding', 2: 'gallery', 3: 'research' };

const LINK_PLATFORM_TO_ID: Record<LinkPlatform, number> = {
  website: 1,
  linkedin: 2,
  google_scholar: 3,
  twitter: 4,
  github: 5,
};
const ID_TO_LINK_PLATFORM: Record<number, LinkPlatform> = {
  1: 'website',
  2: 'linkedin',
  3: 'google_scholar',
  4: 'twitter',
  5: 'github',
};

function lookup<T>(map: Record<number, T>, id: number, kind: string): T {
  const value = map[id];
  if (value === undefined) {
    throw new Error(`Unknown ${kind} id: ${id}`);
  }
  return value;
}

export const roleToId = (role: Role): number => ROLE_TO_ID[role];
export const idToRole = (id: number): Role => lookup(ID_TO_ROLE, id, 'role');

export const statusToId = (status: ContentStatus): number => STATUS_TO_ID[status];
export const idToStatus = (id: number): ContentStatus => lookup(ID_TO_STATUS, id, 'content_status');

export const positionToId = (position: MemberPosition): number => POSITION_TO_ID[position];
export const idToPosition = (id: number): MemberPosition => lookup(ID_TO_POSITION, id, 'member_position');

export const postTypeToId = (postType: PostType): number => POST_TYPE_TO_ID[postType];
export const idToPostType = (id: number): PostType => lookup(ID_TO_POST_TYPE, id, 'post_type');

export const linkPlatformToId = (platform: LinkPlatform): number => LINK_PLATFORM_TO_ID[platform];
export const idToLinkPlatform = (id: number): LinkPlatform => lookup(ID_TO_LINK_PLATFORM, id, 'link_platform');
