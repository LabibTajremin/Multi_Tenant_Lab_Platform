import type { Member } from '@/domain/entities/Member';
import type { IMemberRepository } from '@/domain/repositories/IMemberRepository';
import type { MemberPosition } from '@/domain/value-objects/MemberPosition';
import type { LinkPlatform } from '@/domain/value-objects/LinkPlatform';
import { canManageMembers } from '@/lib/rbac';
import type { UseCaseContext } from '../../context';
import { createMemberSchema } from '../../dtos/memberDtos';
import { PermissionError, ValidationError } from '../../errors';

export interface CreateMemberProfileDeps {
  repo: IMemberRepository;
}

/** Section 6: creating a member profile is Admin-only (an Editor may only later
 * edit their own linked profile, not create new ones). */
export async function createMemberProfile(
  input: unknown,
  ctx: UseCaseContext,
  deps: CreateMemberProfileDeps,
): Promise<Member> {
  if (!canManageMembers(ctx.actor)) {
    throw new PermissionError('Only an Admin can add member profiles.');
  }

  const parsed = createMemberSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError('Invalid member input', parsed.error.issues.map((i) => i.message));
  }

  return deps.repo.create({
    tenantId: ctx.tenantId,
    fullName: parsed.data.fullName,
    position: parsed.data.position as MemberPosition,
    photoUrl: parsed.data.photoUrl,
    photoAlt: parsed.data.photoAlt,
    bio: parsed.data.bio,
    contactEmail: parsed.data.contactEmail,
    joinDate: parsed.data.joinDate,
    leaveDate: parsed.data.leaveDate,
    sortOrder: parsed.data.sortOrder,
    links: parsed.data.links?.map((l) => ({ platform: l.platform as LinkPlatform, url: l.url })),
  });
}
