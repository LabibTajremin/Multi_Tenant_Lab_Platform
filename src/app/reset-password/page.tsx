'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? 'Could not update password.');
      setSubmitting(false);
      return;
    }

    await signOut({ callbackUrl: '/login' });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">Set a new password</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        For security, you must choose your own password before continuing.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Confirm new password
          </label>
          <input
            id="confirm"
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
        >
          {submitting ? 'Saving…' : 'Save password'}
        </button>
      </form>
    </main>
  );
}
