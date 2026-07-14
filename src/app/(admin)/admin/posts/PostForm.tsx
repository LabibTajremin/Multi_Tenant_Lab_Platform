'use client';

import { useFormState, useFormStatus } from 'react-dom';
import type { Post } from '@/domain/entities/Post';
import { POST_TYPES } from '@/domain/value-objects/PostType';
import { initialFormState, type FormState } from '@/lib/formState';
import FileUploadField from '@/components/admin/FileUploadField';

const POST_TYPE_LABELS: Record<string, string> = { funding: 'Funding', gallery: 'Gallery', research: 'Research' };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
    >
      {pending ? 'Saving…' : label}
    </button>
  );
}

export default function PostForm({
  action,
  post,
  submitLabel,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  post?: Post;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, initialFormState);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {!post && (
        <div>
          <label htmlFor="postType" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Type <span className="text-red-600">*</span>
          </label>
          <select
            id="postType"
            name="postType"
            required
            className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100"
          >
            {POST_TYPES.map((type) => (
              <option key={type} value={type}>
                {POST_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Title <span className="text-red-600">*</span>
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={post?.title}
          className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Description
        </label>
        <textarea
          id="body"
          name="body"
          rows={5}
          defaultValue={post?.body ?? ''}
          className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      <FileUploadField
        name="imageUrl"
        category="image"
        accept="image/jpeg,image/png,image/webp"
        label="Image"
        defaultValue={post?.imageUrl ?? ''}
      />

      <div>
        <label htmlFor="imageAlt" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Image alt text {`(required if an image is set)`}
        </label>
        <input
          id="imageAlt"
          name="imageAlt"
          defaultValue={post?.imageAlt ?? ''}
          className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
