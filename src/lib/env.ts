import { z } from 'zod';

// Validated once at module load so a half-configured deployment fails fast at boot
// (Section 14) rather than surfacing as a confusing runtime error deep in a request.
const envSchema = z.object({
  TENANT_ID: z.string().uuid({ message: 'TENANT_ID must be a UUID' }),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url({ message: 'NEXTAUTH_URL must be a valid URL' }),
  STORAGE_ENDPOINT: z.string().min(1, 'STORAGE_ENDPOINT is required'),
  STORAGE_REGION: z.string().min(1, 'STORAGE_REGION is required'),
  STORAGE_BUCKET: z.string().min(1, 'STORAGE_BUCKET is required'),
  STORAGE_ACCESS_KEY_ID: z.string().min(1, 'STORAGE_ACCESS_KEY_ID is required'),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(1, 'STORAGE_SECRET_ACCESS_KEY is required'),
  STORAGE_FORCE_PATH_STYLE: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  STORAGE_PUBLIC_BASE_URL: z.string().url({ message: 'STORAGE_PUBLIC_BASE_URL must be a valid URL' }),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}

let cached: Env | undefined;

/** Lazily validated, memoized singleton — call sites don't re-run Zod on every access. */
export function getEnv(): Env {
  if (!cached) {
    cached = parseEnv();
  }
  return cached;
}

/** Test-only escape hatch to reset the memoized singleton between test cases. */
export function __resetEnvCacheForTests(): void {
  cached = undefined;
}
