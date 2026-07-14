'use client';

import { useFormState, useFormStatus } from 'react-dom';
import type { Tenant } from '@/domain/entities/Tenant';
import type { SiteSettings } from '@/domain/entities/SiteSettings';
import { LINK_PLATFORMS } from '@/domain/value-objects/LinkPlatform';
import { initialFormState, type FormState } from '@/lib/formState';
import FileUploadField from '@/components/admin/FileUploadField';
import AccentColorPicker from '@/components/admin/AccentColorPicker';
import BackgroundPatternPicker from '@/components/admin/BackgroundPatternPicker';
import { updateSettingsAction } from './actions';

const PLATFORM_LABELS: Record<string, string> = {
  website: 'Website',
  linkedin: 'LinkedIn',
  google_scholar: 'Google Scholar',
  twitter: 'Twitter / X',
  github: 'GitHub',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
    >
      {pending ? 'Saving…' : 'Save settings'}
    </button>
  );
}

export default function SettingsForm({ tenant, settings }: { tenant: Tenant; settings: SiteSettings | null }) {
  const [state, formAction] = useFormState<FormState, FormData>(updateSettingsAction, initialFormState);
  const linkFor = (platform: string) => settings?.socialLinks.find((l) => l.platform === platform)?.url ?? '';

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <div>
        <label htmlFor="labName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Lab name <span className="text-red-600">*</span>
        </label>
        <input
          id="labName"
          name="labName"
          required
          defaultValue={tenant.labName}
          className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      <div>
        <label htmlFor="university" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          University
        </label>
        <input
          id="university"
          name="university"
          defaultValue={tenant.university ?? ''}
          className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      <div>
        <label htmlFor="tagline" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Tagline
        </label>
        <input
          id="tagline"
          name="tagline"
          defaultValue={settings?.tagline ?? ''}
          className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      <div>
        <label htmlFor="contactEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Public contact email
        </label>
        <input
          id="contactEmail"
          name="contactEmail"
          type="email"
          defaultValue={settings?.contactEmail ?? ''}
          className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      <FileUploadField
        name="logoUrl"
        category="logo"
        accept="image/jpeg,image/png,image/webp"
        label="Logo"
        defaultValue={tenant.logoUrl ?? ''}
        hint="Recommended ratio: 1:1 (square) — e.g. 512×512px. PNG with a transparent background works best."
      />

      <FileUploadField
        name="bannerUrl"
        category="banner"
        accept="image/jpeg,image/png,image/webp"
        label="Banner image"
        defaultValue={settings?.bannerUrl ?? ''}
        hint="Recommended ratio: 4:1 (wide) — e.g. 1600×400px. It's cropped to fill the hero banner, so keep key content centered."
      />

      <fieldset>
        <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">Accent color</legend>
        <AccentColorPicker defaultValue={tenant.primaryColor ?? undefined} />
      </fieldset>

      <fieldset>
        <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">Background pattern</legend>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          A subtle texture applied across both the admin and public site.
        </p>
        <BackgroundPatternPicker defaultValue={tenant.backgroundPattern} />
      </fieldset>

      <fieldset>
        <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">Social links</legend>
        <div className="mt-2 space-y-2">
          {LINK_PLATFORMS.map((platform) => (
            <div key={platform}>
              <label htmlFor={`link_${platform}`} className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                {PLATFORM_LABELS[platform]}
              </label>
              <input
                id={`link_${platform}`}
                name={`link_${platform}`}
                type="url"
                defaultValue={linkFor(platform)}
                className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100"
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

      <SubmitButton />
    </form>
  );
}
