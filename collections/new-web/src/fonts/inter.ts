import localFont from 'next/font/local';

export const inter = localFont({
  src: [
    { path: '../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', style: 'normal' },
    { path: '../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-italic.woff2', style: 'italic' },
  ],
  weight: '100 900',
  variable: '--font-inter',
  display: 'swap',
  // no metric-adjusted Arial fallback: Windows' Arial has Arabic glyphs and would shadow the Persian font
  adjustFontFallback: false,
});
