import Link from 'next/link';
import type { Tenant } from '@/domain/entities/Tenant';
import { resolveAccent, accentClasses } from '@/lib/accent';
import ThemeToggle from '@/components/ThemeToggle';
import MobileNav from './MobileNav';

const NAV_LINKS = [
  { href: '/research', label: 'Research' },
  { href: '/people', label: 'People' },
  { href: '/publications', label: 'Publications' },
  { href: '/news', label: 'News' },
  { href: '/funding', label: 'Funding' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
];

export default function SiteHeader({ tenant }: { tenant: Tenant }) {
  const accent = accentClasses(resolveAccent(tenant.primaryColor));

  return (
    // z-30 (not just relative) so this establishes its own stacking context —
    // otherwise the mobile dropdown's z-index only competes with siblings
    // inside header, and a sibling section below (e.g. the home page hero,
    // itself position:relative) can still paint on top of it.
    <header className="relative z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-content items-center gap-3 px-6 py-4">
        <Link
          href="/login"
          aria-label="Admin login"
          title="Admin login"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z"
            />
          </svg>
        </Link>
        <Link href="/" className="flex flex-1 items-center gap-3">
          {tenant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logoUrl} alt={`${tenant.labName} logo`} className="h-9 w-9 rounded object-cover" />
          ) : (
            <span className={`flex h-9 w-9 items-center justify-center rounded ${accent.bg500} font-display text-sm font-semibold text-white`}>
              {tenant.labName.charAt(0)}
            </span>
          )}
          <span className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">{tenant.labName}</span>
        </Link>
        <div className="flex items-center gap-2">
          <nav className="hidden gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`self-center text-sm font-medium text-slate-600 transition ${accent.hoverText600} dark:text-slate-400`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
          <MobileNav links={NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}
