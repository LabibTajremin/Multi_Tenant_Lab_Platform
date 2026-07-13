import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Email must be valid'),
  password: z.string().min(1, 'Password is required'),
});

export const createEditorSchema = z.object({
  email: z.string().trim().email('Email must be valid'),
  displayName: z.string().trim().min(1, 'Display name is required').max(200),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type CreateEditorDto = z.infer<typeof createEditorSchema>;
