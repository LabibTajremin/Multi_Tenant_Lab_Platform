// Curated background-pattern palette (same reasoning as ACCENT_COLORS in
// theme.ts: a small set of pre-tuned options, not an open picker, so every
// choice stays subtle and professional). Keys must match the .bg-pattern-<value>
// classes defined in globals.css.
export const BACKGROUND_PATTERNS = [
  { value: 'plain', label: 'Plain' },
  { value: 'dots', label: 'Dots' },
  { value: 'grid', label: 'Grid' },
  { value: 'diagonal', label: 'Diagonal Lines' },
  { value: 'cross', label: 'Cross' },
  { value: 'hexagons', label: 'Hexagons' },
  { value: 'triangles', label: 'Triangles' },
  { value: 'waves', label: 'Waves' },
  { value: 'rings', label: 'Rings' },
] as const;

export type BackgroundPattern = (typeof BACKGROUND_PATTERNS)[number]['value'];

export function isBackgroundPattern(value: string): value is BackgroundPattern {
  return BACKGROUND_PATTERNS.some((p) => p.value === value);
}

export function resolveBackgroundPattern(value: string | null | undefined): BackgroundPattern {
  return value && isBackgroundPattern(value) ? value : 'dots';
}

export function backgroundPatternClass(value: string | null | undefined): string {
  return `bg-pattern-${resolveBackgroundPattern(value)}`;
}
