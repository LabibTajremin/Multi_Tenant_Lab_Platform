import type { Member } from '@/domain/entities/Member';
import type { IMemberRepository, MemberPatch } from '@/domain/repositories/IMemberRepository';
import type { MemberPosition } from '@/domain/value-objects/MemberPosition';
import { canEditMemberProfile } from '@/lib/rbac';
import type { UseCaseContext } from '../../context';
import { updateMemberSchema } from '../../dtos/memberDtos';
import { NotFoundError, PermissionError, ValidationError } from '../../errors';

export interface UpdateMemberProfileDeps {
  repo: IMemberRepository;
}

// Section 6: Editors may edit only their own profile's bio/contact/photo/links —
// structural fields (name, position, dates, display order) stay Admin-only even
// when editing your own profile, so an Editor can't self-promote to "PI".
const SELF_EDITABLE_FIELDS = ['photoUrl', 'photoAlt', 'bio', 'contactEmail'] as const;

export async function updateMemberProfile(
  id: string,
  input: unknown,
  ctx: UseCaseContext,
  deps: UpdateMemberProfileDeps,
): Promise<Member> {
  const existing = await deps.repo.findById(ctx.tenantId, id);
  if (!existing) {
    throw new NotFoundError(`Member not found: ${id}`);
  }

  if (!canEditMemberProfile(ctx.actor, existing)) {
    throw new PermissionError('You do not have permission to edit this member profile.');
  }

  const parsed = updateMemberSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError('Invalid member input', parsed.error.issues.map((i) => i.message));
  }

  const isAdmin = ctx.actor!.role === 'admin';
  const data = parsed.data;
  const patch: MemberPatch = isAdmin
    ? {
        fullName: data.fullName,
        position: data.position as MemberPosition | undefined,
        photoUrl: data.photoUrl,
        photoAlt: data.photoAlt,
        bio: data.bio,
        contactEmail: data.contactEmail,
        joinDate: data.joinDate,
        leaveDate: data.leaveDate,
        sortOrder: data.sortOrder,
      }
    : Object.fromEntries(SELF_EDITABLE_FIELDS.filter((f) => f in data).map((f) => [f, data[f]]));

  const updated = await deps.repo.update(ctx.tenantId, id, patch);

  // Links (website/LinkedIn/Google Scholar/etc.) are personal profile info, so
  // both an Admin and a member editing their own profile may update them.
  if (data.links) {
    await deps.repo.setLinks(ctx.tenantId, id, data.links as Member['links']);
  }

  return updated;
}
