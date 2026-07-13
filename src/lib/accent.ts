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
    text500: `text-accent-${accent}-500`,
    text600: `text-accent-${accent}-600`,
    text700: `text-accent-${accent}-700`,
    border300: `border-accent-${accent}-300`,
    ring500: `ring-accent-${accent}-500`,
    focusRing500: `focus:ring-accent-${accent}-500`,
    focusBorder500: `focus:border-accent-${accent}-500`,
    bg50: `bg-accent-${accent}-50`,
    bg100: `bg-accent-${accent}-100`,
  };
}
