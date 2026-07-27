'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { canChangeSiteSettings, canManageUsers, type AuthUser } from '@/lib/rbac';
import ThemeToggle from '@/components/ThemeToggle';
import SignOutButton from './SignOutButton';

const BASE_LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/publications', label: 'Publications' },
  { href: '/admin/members', label: 'People' },
  { href: '/admin/news', label: 'News' },
  { href: '/admin/posts', label: 'Funding & Gallery' },
];

function buildLinks(actor: AuthUser, reviewEnabled: boolean) {
  const links = [...BASE_LINKS];
  if (reviewEnabled) {
    links.push({ href: '/admin/review-queue', label: 'Review Queue' });
  }
  if (canManageUsers(actor)) {
    links.push({ href: '/admin/users', label: 'Users' });
  }
  if (canChangeSiteSettings(actor)) {
    links.push({ href: '/admin/settings', label: 'Settings' });
  }
  return links;
}

/** The shared navigation body — same markup for the desktop sidebar and the
 * mobile drawer, so the two never drift apart. */
function NavBody({
  links,
  pathname,
  onNavigate,
}: {
  links: { href: string; label: string }[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex h-full flex-col justify-between bg-slate-900 px-4 py-6 text-white">
      <div>
        <p className="px-2 font-display text-lg font-semibold">Lab Admin</p>
        <ul className="mt-8 space-y-1">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? 'bg-slate-800 font-medium text-white'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="space-y-3 border-t border-slate-800 pt-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="block px-2 text-sm text-slate-300 transition-colors hover:text-white"
        >
          View public site
        </Link>
        <div className="flex items-center justify-between px-2">
          <SignOutButton />
          <ThemeToggle variant="sidebar" />
        </div>
      </div>
    </nav>
  );
}

export default function AdminNav({ actor, reviewEnabled }: { actor: AuthUser; reviewEnabled: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? '';
  const links = buildLinks(actor, reviewEnabled);

  return (
    <>
      {/* Mobile top bar — the sidebar would swallow half a phone screen, so it
          collapses behind a hamburger below the md breakpoint. */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-slate-900 px-4 py-3 text-white md:hidden">
        <span className="font-display text-lg font-semibold">Lab Admin</span>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="admin-mobile-drawer"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer + backdrop */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <div id="admin-mobile-drawer" className="animate-enter absolute inset-y-0 left-0 w-72 max-w-[80%] shadow-2xl">
            <NavBody links={links} pathname={pathname} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden w-64 shrink-0 md:block">
        <div className="sticky top-0 h-screen">
          <NavBody links={links} pathname={pathname} />
        </div>
      </div>
    </>
  );
}
