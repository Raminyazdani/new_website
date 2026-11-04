import localFont from 'next/font/local';

export const spaceGrotesk = localFont({
  src: '../../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2',
  weight: '300 700',
  variable: '--font-space-grotesk',
  display: 'swap',
  // no metric-adjusted Arial fallback: Windows' Arial has Arabic glyphs and would shadow the Persian font
  adjustFontFallback: false,
});
