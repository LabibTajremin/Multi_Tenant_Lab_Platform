import { z } from 'zod';
import { MEMBER_POSITIONS } from '@/domain/value-objects/MemberPosition';
import { LINK_PLATFORMS } from '@/domain/value-objects/LinkPlatform';

const memberLinkSchema = z.object({
  platform: z.enum(LINK_PLATFORMS as [string, ...string[]]),
  url: z.string().trim().url('Link URL must be valid'),
});

const baseMemberSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(200),
  position: z.enum(MEMBER_POSITIONS as [string, ...string[]]),
  photoUrl: z.string().trim().url('Photo URL must be valid').optional(),
  photoAlt: z.string().trim().max(300).optional(),
  bio: z.string().trim().max(5000).optional(),
  contactEmail: z.string().trim().email('Contact email must be valid').optional(),
  joinDate: z.coerce.date().optional(),
  leaveDate: z.coerce.date().optional(),
  sortOrder: z.number().int().optional(),
  links: z.array(memberLinkSchema).max(LINK_PLATFORMS.length).optional(),
});

// Section 9.1: alt text is required on every image upload, for accessibility.
const requireAltWithPhoto = (data: { photoUrl?: string; photoAlt?: string }) => !data.photoUrl || !!data.photoAlt;
const altTextIssue = { message: 'Alt text is required whenever a photo is set', path: ['photoAlt'] };

export const createMemberSchema = baseMemberSchema.refine(requireAltWithPhoto, altTextIssue);
export const updateMemberSchema = baseMemberSchema.partial().refine(requireAltWithPhoto, altTextIssue);

export type CreateMemberDto = z.infer<typeof baseMemberSchema>;
export type UpdateMemberDto = Partial<CreateMemberDto>;
