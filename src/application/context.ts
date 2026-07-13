import type { AuthUser } from '@/lib/rbac';

/**
 * Every content use case takes this instead of trusting individual parameters,
 * so tenantId always comes from the caller's resolved context (env/session) and
 * never from user-supplied input — the thing the Section 15.2 tenant-scoping
 * tests assert on.
 */
export interface UseCaseContext {
  actor: AuthUser | null;
  tenantId: string;
  reviewEnabled: boolean;
}
