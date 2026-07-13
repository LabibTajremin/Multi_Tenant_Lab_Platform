import { getCurrentTenant } from '@/lib/tenantContext';
import { PostgresSiteSettingsRepository } from '@/infrastructure/repositories/PostgresSiteSettingsRepository';
import { resolveAccent, accentClasses } from '@/lib/accent';

const PLATFORM_LABELS: Record<string, string> = {
  website: 'Website',
  linkedin: 'LinkedIn',
  google_scholar: 'Google Scholar',
  twitter: 'Twitter / X',
  github: 'GitHub',
};

export default async function ContactPage() {
  const tenant = await getCurrentTenant();
  const accent = accentClasses(resolveAccent(tenant.primaryColor));
  const settings = await new PostgresSiteSettingsRepository().getByTenant(tenant.id);

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <h1 className="font-display text-3xl font-semibold text-slate-900">Contact</h1>

      <div className="mt-8 max-w-md space-y-4">
        {tenant.university && <p className="text-slate-700">{tenant.university}</p>}
        {settings?.contactEmail ? (
          <a href={`mailto:${settings.contactEmail}`} className={`block text-lg font-medium ${accent.text600} hover:underline`}>
            {settings.contactEmail}
          </a>
        ) : (
          <p className="text-slate-500">No contact email listed yet.</p>
        )}

        {(settings?.socialLinks.length ?? 0) > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-900">Find us online</p>
            <ul className="mt-2 space-y-1">
              {settings!.socialLinks.map((link) => (
                <li key={link.platform}>
                  <a href={link.url} target="_blank" rel="noreferrer" className={`${accent.text600} hover:underline`}>
                    {PLATFORM_LABELS[link.platform] ?? link.platform}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
