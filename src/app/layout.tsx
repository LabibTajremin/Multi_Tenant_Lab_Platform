import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import { getCurrentTenant } from '@/lib/tenantContext';
import { backgroundPatternClass } from '@/lib/backgroundPattern';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Lab Platform',
  description: 'Academic research lab website platform',
};

// Reads live, per-deployment DB state (the tenant's background-pattern
// choice) on every request — see the (public) layout for the full
// rationale on why this can't be statically prerendered.
export const dynamic = 'force-dynamic';

// Sets the `dark` class before first paint, straight from localStorage (falling
// back to the OS preference on a first visit) — running this any later, e.g. in
// a useEffect, would paint the wrong theme for a frame on every load.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getCurrentTenant();

  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`bg-surface ${backgroundPatternClass(tenant.backgroundPattern)} font-body`}>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
