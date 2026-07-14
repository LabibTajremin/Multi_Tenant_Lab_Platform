import { redirect } from 'next/navigation';
import { getCurrentTenant } from '@/lib/tenantContext';
import { getSessionUser } from '@/lib/session';
import { ACCENT_COLORS } from '@/lib/theme';
import FileUploadField from '@/components/admin/FileUploadField';
import AccentColorPicker from '@/components/admin/AccentColorPicker';
import BackgroundPatternPicker from '@/components/admin/BackgroundPatternPicker';
import { completeSetup } from './actions';

// Reads live per-deployment DB state — never statically prerendered (see the
// (public) layout for the full rationale).
export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  // Gated behind the Admin account provision-tenant.ts created — an
  // unauthenticated visitor who reaches this deployment before its real Admin
  // logs in gets sent to /login rather than seeing (or completing) this form.
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') {
    redirect('/login');
  }

  const tenant = await getCurrentTenant();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-slate-100">Welcome to {tenant.labName}</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        This deployment hasn&apos;t been finished setting up yet. Confirm a few details below to launch your lab
        website.
      </p>

      <form action={completeSetup} className="mt-10 space-y-6">
        <div>
          <label htmlFor="labName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Lab name
          </label>
          <input
            id="labName"
            name="labName"
            type="text"
            required
            defaultValue={tenant.labName}
            className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 shadow-sm focus:border-accent-ocean-500 focus:outline-none focus:ring-1 focus:ring-accent-ocean-500 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label htmlFor="tagline" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Tagline
          </label>
          <input
            id="tagline"
            name="tagline"
            type="text"
            placeholder="Advancing research, together."
            className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 shadow-sm focus:border-accent-ocean-500 focus:outline-none focus:ring-1 focus:ring-accent-ocean-500 dark:bg-slate-800 dark:text-slate-100"
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
            className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 shadow-sm focus:border-accent-ocean-500 focus:outline-none focus:ring-1 focus:ring-accent-ocean-500 dark:bg-slate-800 dark:text-slate-100"
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

        <fieldset>
          <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">Accent color</legend>
          <AccentColorPicker defaultValue={ACCENT_COLORS[0].value} />
        </fieldset>

        <fieldset>
          <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">Background pattern</legend>
          <BackgroundPatternPicker defaultValue="dots" />
        </fieldset>

        <input type="hidden" name="theme" value="default" />

        <button
          type="submit"
          className="w-full rounded-md bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
        >
          Launch my lab site
        </button>
      </form>
    </main>
  );
}
