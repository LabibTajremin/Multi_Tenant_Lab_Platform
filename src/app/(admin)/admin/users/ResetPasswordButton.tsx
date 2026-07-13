'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { resetPasswordAction, type ResetPasswordFormState } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="text-slate-700 hover:underline disabled:opacity-60">
      {pending ? 'Resetting…' : 'Reset password'}
    </button>
  );
}

export default function ResetPasswordButton({ userId }: { userId: string }) {
  const action = resetPasswordAction.bind(null, userId);
  const [state, formAction] = useFormState(action, {} as ResetPasswordFormState);

  if (state.temporaryPassword) {
    return (
      <span className="text-xs text-green-700">
        New password: <code className="rounded bg-green-50 px-1 py-0.5 font-mono">{state.temporaryPassword}</code>
      </span>
    );
  }

  return (
    <form action={formAction} className="inline">
      <SubmitButton />
    </form>
  );
}
