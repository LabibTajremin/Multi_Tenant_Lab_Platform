import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/auth/authOptions';
import type { AuthUser } from './rbac';

export interface SessionUser extends AuthUser {
  email: string;
  name: string;
  mustResetPassword: boolean;
}

/** Server-side session read (Section 10: re-verified on every request, never
 * trusted from the client). Returns null for a logged-out visitor. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }
  return {
    id: session.user.id,
    role: session.user.role,
    email: session.user.email,
    name: session.user.name,
    mustResetPassword: session.user.mustResetPassword,
  };
}
