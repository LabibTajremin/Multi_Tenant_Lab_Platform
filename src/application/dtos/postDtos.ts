import { z } from 'zod';
import { POST_TYPES } from '@/domain/value-objects/PostType';

const basePostSchema = z.object({
  postType: z.enum(POST_TYPES as [string, ...string[]]),
  title: z.string().trim().min(1, 'Title is required').max(300),
  body: z.string().trim().max(20000).optional(),
  imageUrl: z.string().trim().url('Image URL must be valid').optional(),
  imageAlt: z.string().trim().max(300).optional(),
});

// Section 9.1: alt text is required on every image upload, for accessibility.
const requireAltWithImage = (data: { imageUrl?: string; imageAlt?: string }) => !data.imageUrl || !!data.imageAlt;
const altTextIssue = { message: 'Alt text is required whenever an image is set', path: ['imageAlt'] };

export const createPostSchema = basePostSchema.refine(requireAltWithImage, altTextIssue);
export const updatePostSchema = basePostSchema.omit({ postType: true }).partial().refine(requireAltWithImage, altTextIssue);

export type CreatePostDto = z.infer<typeof basePostSchema>;
export type UpdatePostDto = Partial<Omit<CreatePostDto, 'postType'>>;
