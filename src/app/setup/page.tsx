import { getCurrentTenant } from '@/lib/tenantContext';
import { ACCENT_COLORS } from '@/lib/theme';
import { completeSetup } from './actions';

// Reads live per-deployment DB state — never statically prerendered (see the
// (public) layout for the full rationale).
export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const tenant = await getCurrentTenant();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <h1 className="font-display text-3xl font-semibold text-slate-900">Welcome to {tenant.labName}</h1>
      <p className="mt-2 text-slate-600">
        This deployment hasn&apos;t been finished setting up yet. Confirm a few details below to launch your lab
        website.
      </p>

      <form action={completeSetup} className="mt-10 space-y-6">
        <div>
          <label htmlFor="labName" className="block text-sm font-medium text-slate-700">
            Lab name
          </label>
          <input
            id="labName"
            name="labName"
            type="text"
            required
            defaultValue={tenant.labName}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-accent-ocean-500 focus:outline-none focus:ring-1 focus:ring-accent-ocean-500"
          />
        </div>

        <div>
          <label htmlFor="tagline" className="block text-sm font-medium text-slate-700">
            Tagline
          </label>
          <input
            id="tagline"
            name="tagline"
            type="text"
            placeholder="Advancing research, together."
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-accent-ocean-500 focus:outline-none focus:ring-1 focus:ring-accent-ocean-500"
          />
        </div>

        <div>
          <label htmlFor="contactEmail" className="block text-sm font-medium text-slate-700">
            Public contact email
          </label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-accent-ocean-500 focus:outline-none focus:ring-1 focus:ring-accent-ocean-500"
          />
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-slate-700">Accent color</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {ACCENT_COLORS.map((color, index) => (
              <label key={color.value} className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                <input type="radio" name="primaryColor" value={color.value} defaultChecked={index === 0} className="sr-only" />
                <span
                  className="h-4 w-4 rounded-full border border-black/10"
                  style={{ backgroundColor: color.swatch }}
                  aria-hidden
                />
                {color.label}
              </label>
            ))}
          </div>
        </fieldset>

        <input type="hidden" name="theme" value="default" />

        <button
          type="submit"
          className="w-full rounded-md bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-800"
        >
          Launch my lab site
        </button>
      </form>
    </main>
  );
}
