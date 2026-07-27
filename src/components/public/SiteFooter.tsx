import Link from 'next/link';
import type { Tenant } from '@/domain/entities/Tenant';
import type { SiteSettings } from '@/domain/entities/SiteSettings';
import { SITE_NAV_LINKS } from '@/lib/siteNav';
import { resolveAccent, accentClasses } from '@/lib/accent';

const PLATFORM_LABELS: Record<string, string> = {
  website: 'Website',
  linkedin: 'LinkedIn',
  google_scholar: 'Google Scholar',
  twitter: 'Twitter / X',
  github: 'GitHub',
};

export default function SiteFooter({ tenant, settings }: { tenant: Tenant; settings: SiteSettings | null }) {
  const accent = accentClasses(resolveAccent(tenant.primaryColor));
  // Admin-controlled SEO/navigation aid: mirror the primary nav in the footer
  // so every page links to every section (helps crawlability). Defaults to on.
  const showFooterNav = settings?.footerNavEnabled ?? true;

  return (
    <footer className="mt-16 border-t border-slate-200 bg-ivory-100 sm:mt-24 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-content px-6 py-10 sm:py-12">
        <div className={`grid gap-8 sm:grid-cols-2 ${showFooterNav ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          <div>
            <p className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">{tenant.labName}</p>
            {tenant.university && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{tenant.university}</p>}
          </div>

          {showFooterNav && (
            <nav aria-label="Footer">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Explore</p>
              <ul className="mt-3 space-y-2">
                {SITE_NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`text-sm text-slate-600 transition-colors ${accent.hoverText600} dark:text-slate-400`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Contact</p>
            {settings?.contactEmail ? (
              <a
                href={`mailto:${settings.contactEmail}`}
                className={`mt-3 block text-sm text-slate-600 transition-colors ${accent.hoverText600} dark:text-slate-400`}
              >
                {settings.contactEmail}
              </a>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-500">See the contact page.</p>
            )}
            <Link
              href="/contact"
              className={`mt-2 block text-sm text-slate-600 transition-colors ${accent.hoverText600} dark:text-slate-400`}
            >
              Contact page →
            </Link>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Elsewhere</p>
            <ul className="mt-3 space-y-2">
              {(settings?.socialLinks ?? []).map((link) => (
                <li key={link.platform}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`text-sm text-slate-600 transition-colors ${accent.hoverText600} dark:text-slate-400`}
                  >
                    {PLATFORM_LABELS[link.platform] ?? link.platform}
                  </a>
                </li>
              ))}
              {(!settings || settings.socialLinks.length === 0) && (
                <li className="text-sm text-slate-500 dark:text-slate-500">No links yet.</li>
              )}
            </ul>
          </div>
        </div>
        <p className="mt-10 text-xs text-slate-400 dark:text-slate-600">
          © {new Date().getFullYear()} {tenant.labName}.
        </p>
      </div>
    </footer>
  );
}
