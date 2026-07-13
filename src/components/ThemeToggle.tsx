'use client';

import { useEffect, useState } from 'react';

const VARIANT_CLASSES = {
  // For bars that themselves flip light/dark (the public SiteHeader, MobileNav).
  header: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  // For the admin sidebar, which is permanently dark regardless of site theme —
  // no dark: prefix needed since the surrounding bg-slate-900 never changes.
  sidebar: 'text-slate-300 hover:bg-slate-800 hover:text-white',
};

/** Persists to localStorage under the same 'theme' key the anti-FOUC inline
 * script in the root layout reads before first paint (see layout.tsx). */
export default function ThemeToggle({ variant = 'header' }: { variant?: keyof typeof VARIANT_CLASSES }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition ${VARIANT_CLASSES[variant]}`}
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="4" />
          <path
            strokeLinecap="round"
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      )}
    </button>
  );
}
