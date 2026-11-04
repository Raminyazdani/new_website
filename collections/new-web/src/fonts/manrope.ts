import localFont from 'next/font/local';

/** Manrope (variable) — Circos figure-first page. */
export const manrope = localFont({
  src: '../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2',
  weight: '200 800',
  variable: '--font-manrope',
  display: 'swap',
  adjustFontFallback: false,
});
