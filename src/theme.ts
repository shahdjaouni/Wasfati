import { Platform, type TextStyle, type ViewStyle } from 'react-native';
import { containerDirectionStyle, paragraphTextStyle } from './rtl/textDirection';

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

const runtimePlatform = Platform.OS === 'web' ? 'web' : 'native';

/** Row direction. Native RTL comes from this plus I18nManager, not from reversed strings. */
export const rtl: ViewStyle = containerDirectionStyle(runtimePlatform);

/** Paragraph direction. Native must stay empty so Arabic is not drawn on the end edge. */
export const paragraph: TextStyle = paragraphTextStyle(runtimePlatform);
