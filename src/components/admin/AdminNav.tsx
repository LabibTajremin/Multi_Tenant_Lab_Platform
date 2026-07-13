import Link from 'next/link';
import { canChangeSiteSettings, canManageUsers, type AuthUser } from '@/lib/rbac';
import SignOutButton from './SignOutButton';

const BASE_LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/publications', label: 'Publications' },
  { href: '/admin/members', label: 'People' },
  { href: '/admin/news', label: 'News' },
  { href: '/admin/posts', label: 'Funding & Gallery' },
];

export default function AdminNav({ actor, reviewEnabled }: { actor: AuthUser; reviewEnabled: boolean }) {
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

  return (
    <nav className="flex h-full flex-col justify-between bg-slate-900 px-4 py-6 text-white">
      <div>
        <p className="px-2 font-display text-lg font-semibold">Lab Admin</p>
        <ul className="mt-8 space-y-1">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-md px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800 hover:text-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-3 border-t border-slate-800 pt-4">
        <Link href="/" className="block px-2 text-sm text-slate-300 transition hover:text-white">
          View public site
        </Link>
        <div className="px-2">
          <SignOutButton />
        </div>
      </div>
    </nav>
  );
}
