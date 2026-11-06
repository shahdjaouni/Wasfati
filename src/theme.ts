import { Platform, type ViewStyle } from 'react-native';

export const colors = {
  background: '#F4F5F0',
  card: '#FFFFFF',
  surface: '#FFFFFF',
  border: '#E1E4DA',
  text: '#1C261F',
  muted: '#5E6B60',
  faint: '#8A978C',
  line: '#E1E4DA',
  white: '#FFFFFF',
  primary: '#2F5D3A',
  primaryDark: '#1F3F27',
  soft: '#E1EADC',
  softAlt: '#E6EDE2',
  saffron: '#D9902A',
  saffronBright: '#E8B35C',
  saffronSoft: '#FBE7C2',
  saffronInk: '#5C3D0A',
  /** Aliases kept so existing screens follow the new identity without a layout rewrite. */
  accent: '#E1EADC',
  button: '#2F5D3A',
  buttonText: '#FFFFFF',
};

export const fonts = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  heading: 'Alexandria_700Bold',
  bold: 'Alexandria_700Bold',
};

/**
 * Native layout uses `direction`. React Native Web rejects that key and
 * compiles `writingDirection` into CSS direction instead.
 */
export const rtl: ViewStyle =
  Platform.OS === 'web'
    ? ({ writingDirection: 'rtl' } as ViewStyle)
    : { direction: 'rtl' };
