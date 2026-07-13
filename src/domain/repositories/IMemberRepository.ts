import type { Member, MemberLink } from '../entities/Member';
import type { MemberPosition } from '../value-objects/MemberPosition';

export interface NewMemberInput {
  tenantId: string;
  fullName: string;
  position: MemberPosition;
  userId?: string | null;
  photoUrl?: string | null;
  photoAlt?: string | null;
  bio?: string | null;
  contactEmail?: string | null;
  joinDate?: Date | null;
  leaveDate?: Date | null;
  sortOrder?: number;
  links?: MemberLink[];
}

export interface MemberPatch {
  fullName?: string;
  position?: MemberPosition;
  photoUrl?: string | null;
  photoAlt?: string | null;
  bio?: string | null;
  contactEmail?: string | null;
  joinDate?: Date | null;
  leaveDate?: Date | null;
  sortOrder?: number;
}

export interface IMemberRepository {
  findById(tenantId: string, id: string): Promise<Member | null>;
  listByTenant(tenantId: string): Promise<Member[]>;
  create(input: NewMemberInput): Promise<Member>;
  update(tenantId: string, id: string, patch: MemberPatch): Promise<Member>;
  delete(tenantId: string, id: string): Promise<void>;
  setLinks(tenantId: string, memberId: string, links: MemberLink[]): Promise<void>;
}
