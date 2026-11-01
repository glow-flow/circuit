/**
 * Themeable colour palette for Tailwind (`theme/palette.cjs`).
 *
 * Every colour token used by the app (slate, accents, custom `void` / `electric`, white, black)
 * is emitted as `rgb(var(--c-<name>-<shade>) / <alpha-value>)`, so components keep using normal
 * Tailwind classes (`bg-void-950`, `text-slate-200`, `border-white/10`, `text-cyan-300` ...).
 *
 * Light mode is produced by MIRRORING each scale (50<->950, 100<->900, 200<->800, 300<->700,
 * 400<->600, 500 stays). Pale "on dark" accents (e.g. cyan-300) therefore become dark
 * "on light" accents (cyan-700) and contrast is preserved automatically, without touching
 * hundreds of component class names.
 *
 * Complexity: O(P * S) at build time (P palettes x S shades); zero runtime JS cost.
 */
const tailwindColors = require('tailwindcss/colors');

/** Mirrored shade for light mode. */
const MIRROR_SHADE = {
  50: 950, 100: 900, 200: 800, 300: 700, 400: 600, 500: 500,
  600: 400, 700: 300, 800: 200, 900: 100, 950: 50,
};

const ACCENT_PALETTE_NAMES = [
  'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple',
  'fuchsia', 'pink', 'rose',
];

/** Custom brand palettes: explicit dark & light values (light chosen for paper-like UI). */
const CUSTOM_PALETTES = {
  void: {
    dark: { 950: '#09090B', 900: '#121214', 850: '#18181B', 800: '#27272A', 700: '#3F3F46' },
    light: { 950: '#F6F7F9', 900: '#FFFFFF', 850: '#F1F3F6', 800: '#E3E7ED', 700: '#CBD2DC' },
  },
  electric: {
    dark: { 300: '#93C5FD', 400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB' },
    light: { 300: '#1D4ED8', 400: '#2563EB', 500: '#2563EB', 600: '#1D4ED8' },
  },
  neon: {
    dark: { 400: '#34D399', 500: '#10B981', 600: '#059669' },
    light: { 400: '#047857', 500: '#059669', 600: '#047857' },
  },
  danger: {
    dark: { 500: '#EF4444', 600: '#DC2626' },
    light: { 500: '#DC2626', 600: '#B91C1C' },
  },
};

/** '#RRGGBB' -> 'R G B' (space-separated channels for rgb(var() / alpha)). */
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

/** Builds Tailwind `colors` config + dark/light CSS variable maps. */
function buildThemePalette() {
  const colors = { transparent: 'transparent', current: 'currentColor', inherit: 'inherit' };
  const darkVars = {};
  const lightVars = {};

  for (const paletteName of ACCENT_PALETTE_NAMES) {
    const scale = tailwindColors[paletteName];
    colors[paletteName] = {};
    for (const shade of Object.keys(MIRROR_SHADE)) {
      if (!scale[shade]) continue;
      const variableName = `--c-${paletteName}-${shade}`;
      colors[paletteName][shade] = variableColor(variableName);
      darkVars[variableName] = hexToChannels(scale[shade]);
      lightVars[variableName] = hexToChannels(scale[MIRROR_SHADE[shade]]);
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

  // White / black flip so `text-white`, `border-white/10`, `bg-black/80` stay legible.
  colors.white = variableColor('--c-white');
  colors.black = variableColor('--c-black');
  darkVars['--c-white'] = '255 255 255';
  darkVars['--c-black'] = '0 0 0';
  lightVars['--c-white'] = '15 23 42';
  lightVars['--c-black'] = '100 116 139';

  return { colors, darkVars, lightVars };
}

module.exports = { buildThemePalette, MIRROR_SHADE };
