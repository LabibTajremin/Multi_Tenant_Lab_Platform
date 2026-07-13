import type { Role } from '@/domain/value-objects/Role';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      tenantId: string;
      mustResetPassword: boolean;
    };
  }

  interface User {
    id: string;
    role: Role;
    tenantId: string;
    mustResetPassword: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    tenantId: string;
    mustResetPassword: boolean;
  }
}
