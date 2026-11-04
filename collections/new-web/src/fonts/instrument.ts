import localFont from 'next/font/local';

export const instrumentSerif = localFont({
  src: [
    { path: '../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2', style: 'normal', weight: '400' },
    { path: '../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2', style: 'italic', weight: '400' },
  ],
  variable: '--font-instrument',
  display: 'swap',
  // no metric-adjusted Arial fallback: Windows' Arial has Arabic glyphs and would shadow the Persian font
  adjustFontFallback: false,
});
