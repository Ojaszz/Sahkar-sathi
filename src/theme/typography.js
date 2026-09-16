import { Platform } from 'react-native';

export const fonts = {
  // Default system font stack (no custom font dependency)
  regular: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  medium: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  semiBold: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  bold: Platform.select({ ios: 'System', android: 'sans-serif-bold', default: 'System' }),
};

export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 38 },
  h1: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 32 },
  h2: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 28 },
  h3: { fontFamily: fonts.semiBold, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  bodyBold: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  captionMedium: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  small: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16 },
  smallBold: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 16 },
  button: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
};
