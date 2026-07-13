import type { Config } from 'tailwindcss';

// Curated accent palette (Section 9): tenants pick one of these, never an open color picker.
// Each entry is tuned so it holds sufficient contrast against white/near-white backgrounds.
const accentPalette = {
  ocean: { 50: '#eef6fb', 100: '#d7ebf5', 300: '#7ec1de', 500: '#1d6f96', 600: '#155877', 700: '#10425a' },
  forest: { 50: '#eef6ee', 100: '#d5ebd6', 300: '#87c08b', 500: '#2d7a3e', 600: '#256432', 700: '#1c4c26' },
  crimson: { 50: '#fbeeee', 100: '#f4d6d6', 300: '#dd8f8f', 500: '#a3282e', 600: '#872025', 700: '#66181c' },
  amber: { 50: '#fbf4e8', 100: '#f3e2c1', 300: '#dfb15e', 500: '#a9711b', 600: '#8b5c16', 700: '#69440f' },
  violet: { 50: '#f1eefa', 100: '#ded6f2', 300: '#a893d9', 500: '#5f3e9e', 600: '#4d3282', 700: '#3a2662' },
  slate: { 50: '#eef1f4', 100: '#d6dde3', 300: '#8fa1b0', 500: '#3d5468', 600: '#324555', 700: '#263441' },
};

const ACCENT_NAMES = Object.keys(accentPalette);
const ACCENT_SHADES = [50, 100, 300, 500, 600, 700];

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  // Explicit toggle (persisted in localStorage), not the OS preference media
  // query — a visitor's choice should stick regardless of their system theme.
  darkMode: 'class',
  // The tenant's chosen accent color (Section 9's curated palette) is only known
  // at runtime — Tailwind's static content scan can't see a class name built via
  // string interpolation like `bg-accent-${tenant.primaryColor}-500`, so every
  // color/shade combination is safelisted explicitly instead.
  safelist: ACCENT_NAMES.flatMap((name) =>
    ACCENT_SHADES.flatMap((shade) => [
      `bg-accent-${name}-${shade}`,
      `text-accent-${name}-${shade}`,
      `border-accent-${name}-${shade}`,
      `ring-accent-${name}-${shade}`,
      `hover:bg-accent-${name}-${shade}`,
      `hover:text-accent-${name}-${shade}`,
      `focus:border-accent-${name}-${shade}`,
      `focus:ring-accent-${name}-${shade}`,
      `dark:bg-accent-${name}-${shade}`,
      `dark:text-accent-${name}-${shade}`,
      `dark:border-accent-${name}-${shade}`,
      `dark:hover:text-accent-${name}-${shade}`,
    ]),
  ),
  theme: {
    extend: {
      colors: {
        accent: accentPalette,
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        prose: '68ch',
        content: '80rem',
      },
    },
  },
  plugins: [],
};

export default config;
