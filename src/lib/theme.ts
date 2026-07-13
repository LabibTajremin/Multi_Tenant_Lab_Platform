// Curated accent palette (Section 9: "a small curated palette, not an open color
// picker, to guarantee every combination still looks good"). Keys must match the
// `accent` colors defined in tailwind.config.ts.
export const ACCENT_COLORS = [
  { value: 'ocean', label: 'Ocean', swatch: '#1d6f96' },
  { value: 'forest', label: 'Forest', swatch: '#2d7a3e' },
  { value: 'crimson', label: 'Crimson', swatch: '#a3282e' },
  { value: 'amber', label: 'Amber', swatch: '#a9711b' },
  { value: 'violet', label: 'Violet', swatch: '#5f3e9e' },
  { value: 'slate', label: 'Slate', swatch: '#3d5468' },
] as const;

export type AccentColor = (typeof ACCENT_COLORS)[number]['value'];

export function isAccentColor(value: string): value is AccentColor {
  return ACCENT_COLORS.some((c) => c.value === value);
}
