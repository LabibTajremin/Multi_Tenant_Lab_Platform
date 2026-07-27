import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import { getCurrentTenant } from '@/lib/tenantContext';
import { backgroundPatternClass } from '@/lib/backgroundPattern';
import { buildSiteMetadata } from '@/lib/seo';
import { PostgresSiteSettingsRepository } from '@/infrastructure/repositories/PostgresSiteSettingsRepository';
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

// Per-tenant SEO metadata (title template, description, Open Graph, Twitter
// card, favicon) resolved live from the tenant row and site settings — see
// buildSiteMetadata. Falls back to safe defaults before an Admin fills them in.
// Tints the mobile browser chrome to match the page surface in each theme, and
// pins sensible zoom defaults so the layout reads as a native-feeling app.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f7f5' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getCurrentTenant();
  const settings = await new PostgresSiteSettingsRepository().getByTenant(tenant.id);
  return buildSiteMetadata(tenant, settings);
}

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
