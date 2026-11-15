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
  gold: string;
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
  accent: palette.hibiscus,
  accentSoft: palette.hibiscusSoft,
  gold: palette.sunset,
  leaf: palette.leaf,
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
  gold: '#FFB870',
  leaf: '#7CC08A',
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
