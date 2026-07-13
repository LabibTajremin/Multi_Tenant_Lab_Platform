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

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
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
