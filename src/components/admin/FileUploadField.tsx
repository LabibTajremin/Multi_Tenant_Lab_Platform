'use client';

import { useRef, useState } from 'react';

/**
 * Pairs a real file-upload button with the existing URL text input (Section
 * 11 upload flow), while still letting an Admin paste an external link
 * directly — both write to the same underlying <input name={name}>, so no
 * server action needs to change to support this.
 */
export default function FileUploadField({
  name,
  category,
  defaultValue,
  accept,
  label,
}: {
  name: string;
  category: 'photo' | 'banner' | 'logo' | 'pdf' | 'image';
  defaultValue?: string;
  accept: string;
  label: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    try {
      const response = await fetch('/api/uploads', { method: 'POST', body: formData });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? 'Upload failed.');
        return;
      }
      setUrl(body.url);
    } catch {
      setError('Upload failed. Check your connection and try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div>
      <label htmlFor={`${name}-url`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id={`${name}-url`}
          name={name}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100"
        />
        <label className="flex cursor-pointer items-center whitespace-nowrap rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
          {uploading ? 'Uploading…' : 'Upload'}
          <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileChange} disabled={uploading} className="sr-only" />
        </label>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        category !== 'pdf' && <img src={url} alt="" className="mt-2 h-20 w-20 rounded object-cover" />
      )}
    </div>
  );
}
