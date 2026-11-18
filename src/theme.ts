import { useColorScheme } from 'react-native';
import { useSettings } from './store';

// Palette drawn from Waikīkī: lagoon water, hibiscus, plumeria, koa wood, Mānoa greens.
const palette = {
  lagoon: '#0E6E74',
  lagoonLight: '#2BA8A4',
  reef: '#7FD1C7',
  hibiscus: '#D6336C',
  hibiscusSoft: '#F7C6D6',
  plumeria: '#FFF6E9',
  sand: '#F3E3C7',
  sunset: '#F29E4C',
  koa: '#6B4226',
  leaf: '#3A7D44',
  fern: '#9BC53D',
  night: '#0B1F26',
  nightCard: '#13303A',
  ink: '#1D2B2E',
};

export type Theme = {
  dark: boolean;
  bg: string;
  card: string;
  cardAlt: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  accent: string;
  accentSoft: string;
  /** Text and icons placed on an accent background (Material's "on" color role). */
  accentText: string;
  accentTextMuted: string;
  gold: string;
  /** Gold for icons and text on the page background; t.gold stays for filled badges. */
  goldInk: string;
  /** Text and icons placed on a leaf background. */
  leafText: string;
  danger: string;
  /** Locked stop badges: grey that still holds white numbers. */
  lockedFill: string;
  leaf: string;
  border: string;
  mapStyle: 'light' | 'dark';
  palette: typeof palette;
  font: { display: string; displayItalic: string; body: string; bodyBold: string; bodySemi: string };
};

const font = {
  display: 'LibreCaslonText_400Regular',
  displayItalic: 'LibreCaslonText_400Regular_Italic',
  body: 'Nunito_400Regular',
  bodySemi: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
};

export const lightTheme: Theme = {
  dark: false,
  bg: palette.plumeria,
  card: '#FFFFFF',
  cardAlt: '#FCEFE0',
  text: palette.ink,
  textMuted: '#5E6B6B',
  primary: palette.lagoon,
  primaryText: '#FFFFFF',
  accent: '#C2255C',
  accentSoft: palette.hibiscusSoft,
  accentText: '#FFFFFF',
  accentTextMuted: '#FFE3EC',
  gold: palette.sunset,
  goldInk: '#9A5408',
  leaf: palette.leaf,
  leafText: '#FFFFFF',
  danger: '#B42318',
  lockedFill: '#5F6E70',
  border: '#E8D9C3',
  mapStyle: 'light',
  palette,
  font,
};

export const darkTheme: Theme = {
  dark: true,
  bg: palette.night,
  card: palette.nightCard,
  cardAlt: '#1A3D48',
  text: '#F4EFE6',
  textMuted: '#9DB4B6',
  primary: palette.lagoonLight,
  primaryText: '#04181C',
  accent: '#FF7AA2',
  accentSoft: '#5A2236',
  accentText: '#2B0614',
  accentTextMuted: '#4A0E24',
  gold: '#FFB870',
  goldInk: '#FFB870',
  leaf: '#7CC08A',
  leafText: '#0B2412',
  danger: '#FF8A80',
  lockedFill: '#5F6E70',
  border: '#24505C',
  mapStyle: 'dark',
  palette,
  font,
};

export function useTheme(): Theme {
  const system = useColorScheme();
  const mode = useSettings((s) => s.themeMode);
  const dark = mode === 'system' ? system === 'dark' : mode === 'dark';
  return dark ? darkTheme : lightTheme;
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio between two #rrggbb colors. */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/** White or ink, whichever reads better on a filled color such as a walk's badge color. */
export function readableOn(bg: string): string {
  return contrast('#FFFFFF', bg) >= contrast(palette.ink, bg) ? '#FFFFFF' : palette.ink;
}
