import { z } from 'zod';

const baseNewsItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300),
  body: z.string().trim().min(1, 'Body is required'),
  imageUrl: z.string().trim().url('Image URL must be valid').optional(),
  imageAlt: z.string().trim().max(300).optional(),
  linkUrl: z.string().trim().url('Link must be a valid URL').optional(),
  publishedDate: z.coerce.date().optional(),
  isFeatured: z.boolean().optional(),
});

// Section 9.1: alt text is required on every image upload, for accessibility.
const requireAltWithImage = (data: { imageUrl?: string; imageAlt?: string }) => !data.imageUrl || !!data.imageAlt;
const altTextIssue = { message: 'Alt text is required whenever an image is set', path: ['imageAlt'] };

export const createNewsItemSchema = baseNewsItemSchema.refine(requireAltWithImage, altTextIssue);
export const updateNewsItemSchema = baseNewsItemSchema.partial().refine(requireAltWithImage, altTextIssue);

export type CreateNewsItemDto = z.infer<typeof baseNewsItemSchema>;
export type UpdateNewsItemDto = Partial<CreateNewsItemDto>;
