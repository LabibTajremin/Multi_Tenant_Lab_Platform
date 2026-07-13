'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-sm text-slate-300 transition hover:text-white"
    >
      Sign out
    </button>
  );
}
