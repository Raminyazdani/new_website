import localFont from 'next/font/local';

export const jakarta = localFont({
  src: [
    { path: '../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2', style: 'normal' },
    { path: '../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-italic.woff2', style: 'italic' },
  ],
  weight: '200 800',
  variable: '--font-jakarta',
  display: 'swap',
  // no metric-adjusted Arial fallback: Windows' Arial has Arabic glyphs and would shadow the Persian font
  adjustFontFallback: false,
});
