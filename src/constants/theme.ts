import '@/global.css';

import { Platform } from 'react-native';

// "Cappuccino" palette: #D6B588 caramel, #C6C0B9 warm grey, #705E46 mocha, #422701 espresso.
// Other tokens are tints and shades of those four. Every text/background pair
// used in the app meets WCAG AA contrast (4.5:1 for text, 3:1 for icons/UI).
// The palette has no green or red: completed sets use palette tones and only
// destructive actions keep a muted red.
export const Colors = {
  light: {
    text: '#422701',
    textSecondary: '#6B5F52',
    background: '#F3EFE9',
    card: '#FBF8F4',
    backgroundElement: '#E9E3DB',
    backgroundSelected: '#C6C0B9',
    border: '#DDD5CB',
    accent: '#705E46',
    accentSoft: '#F1E4CF',
    onAccent: '#FFFFFF',
    success: '#705E46',
    successSoft: '#F0E2CC',
    onSuccess: '#FFFFFF',
    danger: '#A3402E',
  },
  dark: {
    text: '#C6C0B9',
    textSecondary: '#A1978C',
    background: '#140C03',
    card: '#21160A',
    backgroundElement: '#2E2010',
    backgroundSelected: '#422701',
    border: '#3D2C16',
    accent: '#D6B588',
    accentSoft: '#33240F',
    onAccent: '#422701',
    success: '#D6B588',
    successSoft: '#3A2A12',
    onSuccess: '#422701',
    danger: '#E3907F',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };
export type ThemeColor = keyof ThemeColors;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded', mono: 'ui-monospace' },
  web: { sans: 'var(--font-display)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
  default: { sans: 'normal', rounded: 'normal', mono: 'monospace' },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const MaxContentWidth = 720;
