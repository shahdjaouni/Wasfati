export const colors = {
  background: '#FFF9F5',
  card: '#FBE7DB',
  accent: '#F2BFA2',
  button: '#D98C6A',
  buttonText: '#FFF9F5',
  text: '#5A4036',
  muted: '#8C6B5E',
  faint: '#C4A08E',
  line: '#F3D6C6',
  white: '#FFFCFA',
};

export const fonts = {
  regular: 'Cairo_400Regular',
  semibold: 'Cairo_600SemiBold',
  bold: 'Cairo_700Bold',
};

/** Applied on screens and rows so Arabic layout stays RTL even before a native reload. */
export const rtl = {
  direction: 'rtl' as const,
};
