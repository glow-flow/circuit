import plugin from 'tailwindcss/plugin';
import palette from './theme/palette.cjs';

const { colors, darkVars, lightVars } = palette.buildThemePalette();

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    colors,
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // Glow shadows intentionally neutralised: crisp matte elevation over glowing blur.
      boxShadow: {
        glow: 'none',
        'glow-blue': 'none',
        'glow-neon': 'none',
        'glow-danger': 'none',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wire-flow': 'wireFlow 1s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        wireFlow: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': darkVars,
        ':root.theme-light': lightVars,
      });
    }),
  ],
};
