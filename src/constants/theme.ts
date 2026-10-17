import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#111214',
    textSecondary: '#62666D',
    background: '#F4F4F6',
    card: '#FFFFFF',
    backgroundElement: '#ECEDF0',
    backgroundSelected: '#E0E1E6',
    border: '#E2E3E7',
    accent: '#FF5A1F',
    accentSoft: '#FFE9E0',
    onAccent: '#FFFFFF',
    success: '#1F9D55',
    successSoft: '#DDF3E6',
    danger: '#D93F3F',
  },
  dark: {
    text: '#F4F5F7',
    textSecondary: '#A1A5AC',
    background: '#0B0B0D',
    card: '#17181B',
    backgroundElement: '#212226',
    backgroundSelected: '#2D2F34',
    border: '#2A2C31',
    accent: '#FF7440',
    accentSoft: '#3A2117',
    onAccent: '#FFFFFF',
    success: '#3DD68C',
    successSoft: '#123222',
    danger: '#FF6369',
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
