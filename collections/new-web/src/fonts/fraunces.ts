import localFont from 'next/font/local';

export const fraunces = localFont({
  src: [
    { path: '../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-opsz-normal.woff2', style: 'normal' },
    { path: '../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-opsz-italic.woff2', style: 'italic' },
  ],
  weight: '100 900',
  variable: '--font-fraunces',
  display: 'swap',
  // no metric-adjusted Arial fallback: Windows' Arial has Arabic glyphs and would shadow the Persian font
  adjustFontFallback: false,
});
