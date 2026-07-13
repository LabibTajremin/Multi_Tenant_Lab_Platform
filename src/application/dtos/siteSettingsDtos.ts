import { z } from 'zod';
import { LINK_PLATFORMS } from '@/domain/value-objects/LinkPlatform';

export const updateSiteSettingsSchema = z.object({
  bannerUrl: z.string().trim().url('Banner URL must be valid').optional(),
  tagline: z.string().trim().max(300).optional(),
  contactEmail: z.string().trim().email('Contact email must be valid').optional(),
  socialLinks: z
    .array(
      z.object({
        platform: z.enum(LINK_PLATFORMS as [string, ...string[]]),
        url: z.string().trim().url('Link URL must be valid'),
      }),
    )
    .max(LINK_PLATFORMS.length)
    .optional(),
});

export type UpdateSiteSettingsDto = z.infer<typeof updateSiteSettingsSchema>;
