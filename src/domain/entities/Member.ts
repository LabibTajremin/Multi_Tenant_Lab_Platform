import type { MemberPosition } from '../value-objects/MemberPosition';
import type { LinkPlatform } from '../value-objects/LinkPlatform';

export interface MemberLink {
  platform: LinkPlatform;
  url: string;
}

export interface Member {
  id: string;
  tenantId: string;
  userId: string | null;
  fullName: string;
  photoUrl: string | null;
  photoAlt: string | null;
  position: MemberPosition;
  bio: string | null;
  contactEmail: string | null;
  joinDate: Date | null;
  leaveDate: Date | null;
  sortOrder: number;
  links: MemberLink[];
  createdAt: Date;
}
