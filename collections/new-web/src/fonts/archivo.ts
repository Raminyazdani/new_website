import localFont from 'next/font/local';

/** Archivo with both axes (weight 100–900, width 62–125) — used by the Swiss design. */
export const archivo = localFont({
  src: [
    { path: '../../node_modules/@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2', style: 'normal' },
    { path: '../../node_modules/@fontsource-variable/archivo/files/archivo-latin-ext-standard-normal.woff2', style: 'normal' },
  ],
  weight: '100 900',
  variable: '--font-archivo',
  display: 'swap',
  // no metric-adjusted Arial fallback: Windows' Arial has Arabic glyphs and would shadow the Persian font
  adjustFontFallback: false,
});
