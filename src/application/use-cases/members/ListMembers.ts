import type { Member } from '@/domain/entities/Member';
import type { IMemberRepository } from '@/domain/repositories/IMemberRepository';
import { compareMembersForDisplay } from '@/domain/value-objects/MemberPosition';

export interface ListMembersDeps {
  repo: IMemberRepository;
}

/** Member profiles have no review/status workflow (Section 7 only applies to
 * publications/news/posts) and are always public, so this has no RBAC gate —
 * both the public /people page and the admin member list call it directly. */
export async function listMembers(tenantId: string, deps: ListMembersDeps): Promise<Member[]> {
  const members = await deps.repo.listByTenant(tenantId);
  return [...members].sort(compareMembersForDisplay);
}
