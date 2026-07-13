import { isAccentColor, type AccentColor } from './theme';

const DEFAULT_ACCENT: AccentColor = 'ocean';

/** Normalizes a tenant's stored primaryColor into one of the curated accent
 * values, falling back to the default if it's null/unrecognized (e.g. a
 * pre-Section-9 row, or manual DB tampering). */
export function resolveAccent(primaryColor: string | null): AccentColor {
  if (primaryColor && isAccentColor(primaryColor)) {
    return primaryColor;
  }
  return DEFAULT_ACCENT;
}

/** Common class name fragments for a given accent — every value here is
 * covered by the safelist in tailwind.config.ts since it's built from a
 * runtime tenant setting rather than appearing as source-code literals. */
export function accentClasses(accent: AccentColor) {
  return {
    bg500: `bg-accent-${accent}-500`,
    bg600: `bg-accent-${accent}-600`,
    hoverBg600: `hover:bg-accent-${accent}-600`,
    hoverText600: `hover:text-accent-${accent}-600 dark:hover:text-accent-${accent}-300`,
    // Links/emphasis text uses the 600/700 shade in light mode, but that reads
    // as near-black on a dark background — the 300 shade (already safelisted)
    // keeps the same accent hue legible against a dark page.
    text500: `text-accent-${accent}-500 dark:text-accent-${accent}-300`,
    text600: `text-accent-${accent}-600 dark:text-accent-${accent}-300`,
    text700: `text-accent-${accent}-700 dark:text-accent-${accent}-300`,
    border300: `border-accent-${accent}-300 dark:border-accent-${accent}-500`,
    ring500: `ring-accent-${accent}-500`,
    focusRing500: `focus:ring-accent-${accent}-500`,
    focusBorder500: `focus:border-accent-${accent}-500`,
    bg50: `bg-accent-${accent}-50`,
    bg100: `bg-accent-${accent}-100`,
  };
}
