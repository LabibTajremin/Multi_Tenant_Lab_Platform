'use client';

import { useFormState, useFormStatus } from 'react-dom';
import type { Publication } from '@/domain/entities/Publication';
import { initialFormState, type FormState } from '@/lib/formState';
import FileUploadField from '@/components/admin/FileUploadField';

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

export default function PublicationForm({
  action,
  publication,
  submitLabel,
  canFeature = false,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  publication?: Publication;
  submitLabel: string;
  canFeature?: boolean;
}) {
  const [state, formAction] = useFormState(action, initialFormState);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
          Title <span className="text-red-600">*</span>
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={publication?.title}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div>
        <label htmlFor="authors" className="block text-sm font-medium text-slate-700">
          Authors <span className="text-red-600">*</span>
        </label>
        <input
          id="authors"
          name="authors"
          required
          placeholder="A. Lovelace, C. Babbage"
          defaultValue={publication?.authors}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="venue" className="block text-sm font-medium text-slate-700">
            Venue
          </label>
          <input
            id="venue"
            name="venue"
            defaultValue={publication?.venue ?? ''}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-slate-700">
            Year <span className="text-red-600">*</span>
          </label>
          <input
            id="year"
            name="year"
            type="number"
            required
            defaultValue={publication?.year}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="doiOrLink" className="block text-sm font-medium text-slate-700">
          DOI or link
        </label>
        <input
          id="doiOrLink"
          name="doiOrLink"
          type="url"
          placeholder="https://doi.org/..."
          defaultValue={publication?.doiOrLink ?? ''}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <FileUploadField
        name="pdfUrl"
        category="pdf"
        accept="application/pdf"
        label="PDF"
        defaultValue={publication?.pdfUrl ?? ''}
      />

      {canFeature && (
        <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
          <input
            id="isFeatured"
            name="isFeatured"
            type="checkbox"
            defaultChecked={publication?.isFeatured ?? false}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
          />
          <label htmlFor="isFeatured" className="text-sm text-slate-700">
            <span className="font-medium">Show on homepage</span>
            <br />
            Featured publications appear in the home page carousel, most recent first.
          </label>
        </div>
      )}

      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
