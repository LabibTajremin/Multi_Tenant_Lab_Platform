import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const createPublicationSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(500),
  authors: z.string().trim().min(1, 'Authors are required').max(1000),
  venue: z.string().trim().max(500).optional(),
  year: z
    .number()
    .int('Year must be a whole number')
    .min(1900, 'Year must be 1900 or later')
    .max(currentYear + 1, `Year must be ${currentYear + 1} or earlier`),
  doiOrLink: z.string().trim().url('DOI/link must be a valid URL').optional(),
  pdfUrl: z.string().trim().url('PDF URL must be valid').optional(),
  isFeatured: z.boolean().optional(),
});

export const updatePublicationSchema = createPublicationSchema.partial();

export type CreatePublicationDto = z.infer<typeof createPublicationSchema>;
export type UpdatePublicationDto = z.infer<typeof updatePublicationSchema>;
