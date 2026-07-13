'use client';

import { useFormState, useFormStatus } from 'react-dom';
import type { Member } from '@/domain/entities/Member';
import { MEMBER_POSITIONS } from '@/domain/value-objects/MemberPosition';
import { LINK_PLATFORMS } from '@/domain/value-objects/LinkPlatform';
import { initialFormState, type FormState } from '@/lib/formState';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
    >
      {pending ? 'Saving…' : label}
    </button>
  );
}

function toDateInputValue(date?: Date | null): string {
  if (!date) return '';
  return new Date(date).toISOString().slice(0, 10);
}

const PLATFORM_LABELS: Record<string, string> = {
  website: 'Website',
  linkedin: 'LinkedIn',
  google_scholar: 'Google Scholar',
  twitter: 'Twitter / X',
  github: 'GitHub',
};

export default function MemberForm({
  action,
  member,
  submitLabel,
  canEditStructuralFields,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  member?: Member;
  submitLabel: string;
  canEditStructuralFields: boolean;
}) {
  const [state, formAction] = useFormState(action, initialFormState);

  const linkFor = (platform: string) => member?.links.find((l) => l.platform === platform)?.url ?? '';

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
          Full name <span className="text-red-600">*</span>
        </label>
        <input
          id="fullName"
          name="fullName"
          required
          readOnly={!canEditStructuralFields}
          defaultValue={member?.fullName}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 read-only:bg-slate-100"
        />
      </div>

      <div>
        <label htmlFor="position" className="block text-sm font-medium text-slate-700">
          Position <span className="text-red-600">*</span>
        </label>
        {/* A disabled <select> submits nothing, so structural-field-locked forms
            (an Editor editing their own profile) carry the real value via a
            hidden input instead, while the visible control stays disabled. */}
        {!canEditStructuralFields && <input type="hidden" name="position" value={member?.position ?? 'PhD'} />}
        <select
          id="position"
          name={canEditStructuralFields ? 'position' : undefined}
          required={canEditStructuralFields}
          disabled={!canEditStructuralFields}
          defaultValue={member?.position ?? 'PhD'}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
        >
          {MEMBER_POSITIONS.map((position) => (
            <option key={position} value={position}>
              {position}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-slate-700">
          Short bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={member?.bio ?? ''}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div>
        <label htmlFor="contactEmail" className="block text-sm font-medium text-slate-700">
          Contact email
        </label>
        <input
          id="contactEmail"
          name="contactEmail"
          type="email"
          defaultValue={member?.contactEmail ?? ''}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div>
        <label htmlFor="photoUrl" className="block text-sm font-medium text-slate-700">
          Photo URL
        </label>
        <input
          id="photoUrl"
          name="photoUrl"
          type="url"
          defaultValue={member?.photoUrl ?? ''}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
        <p className="mt-1 text-xs text-slate-500">Upload support is coming soon — paste a link for now.</p>
      </div>

      <div>
        <label htmlFor="photoAlt" className="block text-sm font-medium text-slate-700">
          Photo alt text {`(required if a photo is set)`}
        </label>
        <input
          id="photoAlt"
          name="photoAlt"
          defaultValue={member?.photoAlt ?? ''}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="joinDate" className="block text-sm font-medium text-slate-700">
            Join date
          </label>
          <input
            id="joinDate"
            name="joinDate"
            type="date"
            readOnly={!canEditStructuralFields}
            defaultValue={toDateInputValue(member?.joinDate)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 read-only:bg-slate-100"
          />
        </div>
        <div>
          <label htmlFor="leaveDate" className="block text-sm font-medium text-slate-700">
            Leave date
          </label>
          <input
            id="leaveDate"
            name="leaveDate"
            type="date"
            readOnly={!canEditStructuralFields}
            defaultValue={toDateInputValue(member?.leaveDate)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 read-only:bg-slate-100"
          />
        </div>
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-slate-700">Links</legend>
        <div className="mt-2 space-y-2">
          {LINK_PLATFORMS.map((platform) => (
            <div key={platform}>
              <label htmlFor={`link_${platform}`} className="block text-xs font-medium text-slate-500">
                {PLATFORM_LABELS[platform]}
              </label>
              <input
                id={`link_${platform}`}
                name={`link_${platform}`}
                type="url"
                defaultValue={linkFor(platform)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
          ))}
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
