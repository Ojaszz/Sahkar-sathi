// Sahkar Sathi design tokens — cooperative green palette
// `colors` is a mutable singleton: applyColorScheme() rewrites the same object
// in place so every `import { colors }` picks up the new theme. Components that
// build styles via makeStyles(colors) recompute on re-render.

export const LIGHT_COLORS = {
  // Primary — cooperative green
  primary: '#0B5D3B',
  primaryDark: '#074A2E',
  primaryLight: '#E7F3EC',
  primaryLighter: '#F2F8F4',
  accent: '#2E9E6B',
  accentLight: '#D9F0E4',

  // Neutral
  background: '#F7F9F8',
  surface: '#FFFFFF',
  border: '#E4E9E6',
  divider: '#EEF2EF',

  // Text
  text: '#16211B',
  textSecondary: '#5B6B61',
  textMuted: '#8A988F',
  textInverse: '#FFFFFF',

  // Status
  success: '#1E9E5A',
  successLight: '#E4F6EC',
  warning: '#E8A020',
  warningLight: '#FDF3E0',
  danger: '#D9534F',
  dangerLight: '#FCECEB',
  info: '#2E7BB0',
  infoLight: '#E6F0F8',

  // Rating
  star: '#F5A623',

  // Misc
  overlay: 'rgba(11, 24, 17, 0.55)',
  shadow: '#0A1F15',
  white: '#FFFFFF',
  black: '#000000',
};

const DARK_COLORS = {
  primary: '#27A876',
  primaryDark: '#0B5D3B',
  primaryLight: '#16382A',
  primaryLighter: '#12291F',
  accent: '#3BBF86',
  accentLight: '#16382A',

  background: '#0F1713',
  surface: '#18211C',
  border: '#2A352E',
  divider: '#232E27',

  text: '#E8F0EA',
  textSecondary: '#A9B8AE',
  textMuted: '#77877D',
  textInverse: '#0F1713',

  success: '#3DD68C',
  successLight: '#16322A',
  warning: '#E8B23A',
  warningLight: '#33280F',
  danger: '#EF6A66',
  dangerLight: '#3A1E1D',
  info: '#4A9FD6',
  infoLight: '#17293A',

  star: '#F5A623',

  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
  white: '#FFFFFF',
  black: '#000000',
};

export const colors = { ...LIGHT_COLORS };

// Current color scheme id ('light' | 'dark')
export let colorScheme = 'light';

export function applyColorScheme(next) {
  colorScheme = next;
  const palette = next === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  for (const key of Object.keys(colors)) {
    colors[key] = palette[key];
  }
  return colors;
}

export const roleColors = {
  customer: '#0B5D3B',
  worker: '#2E7BB0',
};
