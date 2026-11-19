/**
 * Dual-theme calibrated colour palette for Tailwind (`theme/palette.cjs`).
 *
 * Emits CSS-variable backed `rgb(var(--c-<name>-<shade>) / <alpha-value>)` tokens for both
 * Dark ("Oscilloscope Bench") and Light (`.theme-light`, "Lab Notebook Paper") modes.
 *
 * Key invariants verified with `.agents/skills/antislop-human/contrast-check.py`:
 * - `white` (`#FFFFFF`) and `black` (`#000000`) NEVER invert across themes so solid CTAs
 *   (`bg-electric-600 text-white`, `bg-emerald-600 text-white`, `bg-red-600 text-white`)
 *   and QR codes retain >= 4.5:1 AA contrast in both Light and Dark mode.
 * - Theme-adaptive foregrounds and subtle hairlines use `ink` (`#F1F5F9` dark / `#0F172A` light),
 *   `control` (`#64748B` >= 3.36:1 border contrast in both themes), and `void` surfaces.
 * - Dark and Light accent scales override unsafe mid-tones so `slate-400/500`, `amber-300/400`,
 *   `emerald-300/400`, `sky-300/400`, `cyan-300/400`, and `red-300/400` pass >= 4.5:1.
 */
const tailwindColors = require('tailwindcss/colors');

const MIRROR_SHADE = {
  50: 950,
  100: 900,
  200: 800,
  300: 700,
  400: 600,
  500: 500,
  600: 400,
  700: 300,
  800: 200,
  900: 100,
  950: 50,
};

const ACCENT_PALETTE_NAMES = [
  'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple',
  'fuchsia', 'pink', 'rose',
];

const CUSTOM_PALETTES = {
  void: {
    dark: { 950: '#0B0F14', 900: '#111722', 850: '#192231', 800: '#222E42', 700: '#64748B' },
    light: { 950: '#F5F7FA', 900: '#FFFFFF', 850: '#EEF2F6', 800: '#E2E8F0', 700: '#64748B' },
  },
  electric: {
    dark: {
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#2563EB',
      600: '#1D4ED8',
      700: '#1E40AF',
      950: '#0F172A',
    },
    light: {
      200: '#1E3A8A',
      300: '#1E40AF',
      400: '#1D4ED8',
      500: '#1D4ED8',
      600: '#1E40AF',
      700: '#1D4ED8',
      950: '#EFF6FF',
    },
  },
  neon: {
    dark: { 300: '#6EE7B7', 400: '#34D399', 500: '#059669', 600: '#047857' },
    light: { 300: '#064E3B', 400: '#065F46', 500: '#047857', 600: '#047857' },
  },
  danger: {
    dark: {
      300: '#FCA5A5',
      400: '#FCA5A5',
      500: '#F87171',
      600: '#B91C1C',
      700: '#991B1B',
      950: '#450A0A',
    },
    light: {
      300: '#7F1D1D',
      400: '#991B1B',
      500: '#B91C1C',
      600: '#B91C1C',
      700: '#991B1B',
      950: '#FEF2F2',
    },
  },
};

/** Calibrated overrides guaranteeing >= 4.5:1 text contrast on elevated dark & light cards. */
const DARK_AA_OVERRIDES = {
  slate: { 400: '#94A3B8', 500: '#94A3B8', 600: '#94A3B8' },
  red: { 500: '#F87171', 600: '#B91C1C' },
  rose: { 500: '#FB7185', 600: '#BE123C' },
  amber: { 500: '#F59E0B', 600: '#B45309' },
  emerald: { 500: '#10B981', 600: '#047857' },
  sky: { 500: '#0284C7', 600: '#0369A1' },
  cyan: { 500: '#0891B2', 600: '#0E7490' },
};

const LIGHT_AA_OVERRIDES = {
  slate: { 100: '#0F172A', 200: '#1E293B', 300: '#334155', 400: '#475569', 500: '#475569', 600: '#475569' },
  amber: { 100: '#78350F', 200: '#78350F', 300: '#92400E', 400: '#92400E', 500: '#B45309', 600: '#92400E', 700: '#B45309' },
  orange: { 300: '#9A3412', 400: '#9A3412', 500: '#C2410C', 600: '#9A3412' },
  yellow: { 300: '#713F12', 400: '#854D0E', 500: '#854D0E', 600: '#854D0E' },
  emerald: { 100: '#064E3B', 200: '#064E3B', 300: '#064E3B', 400: '#065F46', 500: '#047857', 600: '#047857' },
  teal: { 200: '#134E4A', 300: '#115E59', 400: '#115E59', 500: '#0F766E', 600: '#0F766E' },
  sky: { 100: '#0C4A6E', 200: '#0C4A6E', 300: '#0C4A6E', 400: '#075985', 500: '#0369A1', 600: '#0369A1' },
  cyan: { 100: '#164E63', 200: '#164E63', 300: '#164E63', 400: '#155E75', 500: '#0E7490', 600: '#0E7490' },
  red: { 100: '#7F1D1D', 200: '#7F1D1D', 300: '#7F1D1D', 400: '#991B1B', 500: '#B91C1C', 600: '#B91C1C' },
  rose: { 200: '#881337', 300: '#881337', 400: '#9F1239', 500: '#BE123C', 600: '#BE123C' },
};

function hexToChannels(hexColor) {
  const normalized = hexColor.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((ch) => ch + ch).join('')
    : normalized;
  const value = parseInt(full, 16);
  return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`;
}

function variableColor(variableName) {
  return `rgb(var(${variableName}) / <alpha-value>)`;
}

function buildThemePalette() {
  const colors = {
    transparent: 'transparent',
    current: 'currentColor',
    inherit: 'inherit',
    white: '#FFFFFF',
    black: '#000000',
  };
  const darkVars = {};
  const lightVars = {};

  for (const paletteName of ACCENT_PALETTE_NAMES) {
    const scale = tailwindColors[paletteName];
    const darkOverrides = DARK_AA_OVERRIDES[paletteName] || {};
    const lightOverrides = LIGHT_AA_OVERRIDES[paletteName] || {};
    colors[paletteName] = {};

    for (const shade of Object.keys(MIRROR_SHADE)) {
      if (!scale[shade]) continue;
      const variableName = `--c-${paletteName}-${shade}`;
      const darkHex = darkOverrides[shade] || scale[shade];
      const lightHex = lightOverrides[shade] || scale[MIRROR_SHADE[shade]];
      colors[paletteName][shade] = variableColor(variableName);
      darkVars[variableName] = hexToChannels(darkHex);
      lightVars[variableName] = hexToChannels(lightHex);
    }
  }

  for (const [paletteName, { dark, light }] of Object.entries(CUSTOM_PALETTES)) {
    colors[paletteName] = {};
    for (const shade of Object.keys(dark)) {
      const variableName = `--c-${paletteName}-${shade}`;
      colors[paletteName][shade] = variableColor(variableName);
      darkVars[variableName] = hexToChannels(dark[shade]);
      lightVars[variableName] = hexToChannels(light[shade]);
    }
  }

  // Adaptive theme semantic tokens (never overload `white` or `black`)
  colors.ink = variableColor('--c-ink');
  colors.control = variableColor('--c-control');
  colors.scrim = variableColor('--c-scrim');
  colors.focus = variableColor('--c-focus');
  colors.copper = {
    DEFAULT: variableColor('--c-copper'),
    text: variableColor('--c-copper-text'),
  };
  colors.pure = {
    white: '#FFFFFF',
    black: '#000000',
    slate: '#0F172A',
    amber: '#F59E0B',
    cyan: '#22D3EE',
  };

  darkVars['--c-ink'] = hexToChannels('#F1F5F9');
  lightVars['--c-ink'] = hexToChannels('#0F172A');

  darkVars['--c-control'] = hexToChannels('#64748B');
  lightVars['--c-control'] = hexToChannels('#64748B');

  darkVars['--c-scrim'] = hexToChannels('#04070B');
  lightVars['--c-scrim'] = hexToChannels('#0F172A');

  darkVars['--c-focus'] = hexToChannels('#38BDF8');
  lightVars['--c-focus'] = hexToChannels('#1D4ED8');

  darkVars['--c-copper'] = hexToChannels('#F59E0B');
  lightVars['--c-copper'] = hexToChannels('#B45309');

  darkVars['--c-copper-text'] = hexToChannels('#FBBF24');
  lightVars['--c-copper-text'] = hexToChannels('#92400E');

  return { colors, darkVars, lightVars };
}

module.exports = { buildThemePalette, MIRROR_SHADE };
