'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createEditorAction, type CreateEditorFormState } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
    >
      {pending ? 'Creating…' : 'Create Editor account'}
    </button>
  );
}

const initialState: CreateEditorFormState = {};

export default function CreateEditorForm() {
  const [state, formAction] = useFormState(createEditorAction, initialState);

  if (state.temporaryPassword) {
    return (
      <div className="max-w-md rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        <p className="font-medium">Editor account created for {state.email}.</p>
        <p className="mt-2">
          Temporary password (shown once — share it securely, it is not stored in plaintext):
        </p>
        <code className="mt-1 block rounded bg-white px-3 py-2 font-mono">{state.temporaryPassword}</code>
      </div>
    );
  }

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-slate-700">
          Display name <span className="text-red-600">*</span>
        </label>
        <input
          id="displayName"
          name="displayName"
          required
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email <span className="text-red-600">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
