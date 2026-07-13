import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { getTenantId } from '@/lib/tenantContext';
import { loginUser } from '@/application/use-cases/auth/LoginUser';
import { ValidationError } from '@/application/errors';

// Credentials-only for now, but every provider-specific bit lives in this one file
// (Section 10) so swapping in magic-link or university SSO later doesn't ripple
// through the app — only this config changes.
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/admin/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const tenantId = getTenantId();
        const users = new PostgresUserRepository();

        let user;
        try {
          user = await loginUser(tenantId, credentials, { userRepo: users });
        } catch (error) {
          if (error instanceof ValidationError) {
            return null;
          }
          throw error;
        }
        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          role: user.role,
          tenantId: user.tenantId,
          mustResetPassword: user.mustResetPassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.mustResetPassword = user.mustResetPassword;
      }
      return token;
    },
    async session({ session, token }) {
      // Re-verify the tenant server-side on every request (Section 10) — never
      // trust a stale token if this deployment's TENANT_ID ever changes.
      if (token.tenantId !== getTenantId()) {
        throw new Error('Session tenant mismatch');
      }
      session.user = {
        id: token.id,
        email: session.user?.email ?? '',
        name: session.user?.name ?? '',
        role: token.role,
        tenantId: token.tenantId,
        mustResetPassword: token.mustResetPassword,
      };
      return session;
    },
  },
};
