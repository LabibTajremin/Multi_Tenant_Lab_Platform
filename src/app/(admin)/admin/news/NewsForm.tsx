'use client';

import { useFormState, useFormStatus } from 'react-dom';
import type { NewsItem } from '@/domain/entities/NewsItem';
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

function toDateInputValue(date?: Date): string {
  if (!date) return '';
  return new Date(date).toISOString().slice(0, 10);
}

export default function NewsForm({
  action,
  newsItem,
  submitLabel,
  canFeature = false,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  newsItem?: NewsItem;
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
          defaultValue={newsItem?.title}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div>
        <label htmlFor="publishedDate" className="block text-sm font-medium text-slate-700">
          Date <span className="text-red-600">*</span>
        </label>
        <input
          id="publishedDate"
          name="publishedDate"
          type="date"
          required
          defaultValue={toDateInputValue(newsItem?.publishedDate) || new Date().toISOString().slice(0, 10)}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-slate-700">
          Body <span className="text-red-600">*</span>
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={6}
          defaultValue={newsItem?.body}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <FileUploadField
        name="imageUrl"
        category="image"
        accept="image/jpeg,image/png,image/webp"
        label="Image"
        defaultValue={newsItem?.imageUrl ?? ''}
      />

      <div>
        <label htmlFor="imageAlt" className="block text-sm font-medium text-slate-700">
          Image alt text {`(required if an image is set)`}
        </label>
        <input
          id="imageAlt"
          name="imageAlt"
          defaultValue={newsItem?.imageAlt ?? ''}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div>
        <label htmlFor="linkUrl" className="block text-sm font-medium text-slate-700">
          Link
        </label>
        <input
          id="linkUrl"
          name="linkUrl"
          type="url"
          defaultValue={newsItem?.linkUrl ?? ''}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      {canFeature && (
        <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
          <input
            id="isFeatured"
            name="isFeatured"
            type="checkbox"
            defaultChecked={newsItem?.isFeatured ?? false}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
          />
          <label htmlFor="isFeatured" className="text-sm text-slate-700">
            <span className="font-medium">Show on homepage</span>
            <br />
            Featured news items appear in the home page carousel, most recent first.
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
